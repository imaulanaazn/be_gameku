import { RequestHandler } from "express";

import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, InvoiceStatuses, OrderStatuses, VoucherType } from "@enum/index";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { GameService } from "@serviceInternal/game.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { CustomerService } from "@serviceInternal/customer.service";
import APIGamesService from "@serviceExternal/apiGames.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { sleep } from "@helper/index";

const path = "/v1/webhook/ewallet";
const method = "POST";
const auth = "webhook-xendit";

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body: {
        event: string;
        business_id: string;
        created: string;
        data: {
            id: string;
            business_id: string;
            reference_id: string;
            status: string;
            currency: string;
            charge_amount: number;
            capture_amount: number;
            checkout_method: string;
            channel_code: string;
            channel_properties: {
                success_redirect_url: string;
            };
            actions: {
                desktop_web_checkout_url: string | null;
                mobile_web_checkout_url: string | null;
                mobile_deeplink_checkout_url: string | null;
                qr_checkout_string: string;
            };
            is_redirect_required: boolean;
            callback_url: string;
            created: string;
            updated: string;
            voided_at: string | null;
            capture_now: boolean;
            customer_id: string | null;
            payment_method_id: string | null;
            failure_code: string | null;
            basket: null;
            metadata: {
                branch_code: string;
            };
        };
    } = req.body;
    console.log(`Webhook VA diterima [${body.data.reference_id}]`);
    console.log(JSON.stringify(body));

    const orderService = new OrderService();
    const invoiceService = new InvoiceService();
    const sysConfigService = new SysConfigService();
    const configApiGames = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_games_merchant_id", "api_games_secret_key"],
        operator: "in",
    });
    const merchantId = configApiGames.find((item) => item.cd === "api_games_merchant_id");
    const secretKey = configApiGames.find((item) => item.cd === "api_games_secret_key");
    const apiGamesService = new APIGamesService({
        merchantId: merchantId.value,
        secretKey: secretKey.value,
    });

    const invoice = await invoiceService.findOneBy({
        column: "id",
        value: body.data.reference_id,
    });

    if (!invoice) {
        throw new BusinessError(
            `Invoice tidak ditemukan dengan invoice: ${body.data.reference_id}`,
            ErrorType.Internal,
        );
    }

    const order = await orderService.findOneBy({
        column: "invoiceId",
        value: invoice.id,
    });

    res.sendStatus(200);

    const customerService = new CustomerService();
    const customer = await customerService.findOneBy({
        column: "id",
        value: order.customerId,
    });

    if (body.data.status === "SUCCEEDED" && invoice.status !== InvoiceStatuses.PAID) {
        await invoiceService.updateBy({
            by: "id",
            value: invoice.id,
            data: {
                status: InvoiceStatuses.PAID,
            },
        });

        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.PENDING_ORDER,
            },
        });

        const orderDetailService = new OrderDetailService();
        const orderDetail = await orderDetailService.findOneBy({
            column: "orderId",
            value: order.id,
        });

        const productService = new ProductService();
        const product = await productService.findOneBy({
            column: "id",
            value: orderDetail.productId,
        });

        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: product.gameId,
        });

        if (game.voucherType === VoucherType.INTERNAL) {
            const gameVoucherService = new GameVoucherService();
            const gameVouchers = await gameVoucherService.model.findAll({
                where: {
                    gameId: game.id,
                    productId: product.id,
                    used: false,
                },
                limit: orderDetail.quantity,
            });

            let vouchers = [];
            if (gameVouchers.length > 0) {
                vouchers = gameVouchers.map((item) => item.code);
                const gameVouchersId = gameVouchers.map((item) => item.id);
                await gameVoucherService.model.update(
                    {
                        used: true,
                    },
                    {
                        where: {
                            id: gameVouchersId,
                        },
                    },
                );
            }

            if (vouchers.length < orderDetail.quantity) {
                const nullCount = orderDetail.quantity - vouchers.length;
                for (let i = 0; i < nullCount; i++) {
                    vouchers.push(null);
                }
            }

            await orderDetailService.updateBy({
                by: "id",
                value: orderDetail.id,
                data: {
                    gameVoucher: JSON.stringify(vouchers),
                },
            });

            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.SUCCESS,
                    completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                },
            });
            io.emit("order:success", order.id);

            const whatsappTemplateService = new WhatsappTemplateService();
            const whatsappTemplate = await whatsappTemplateService.findOneBy({
                column: "cd",
                value: "voucher",
            });
            client.sendNotifyVoucher({
                targetNumber: customer.mobileNumber,
                message: whatsappTemplate,
                isTest: false,
                data: {
                    gameName: game.name,
                    voucher: vouchers,
                    productName: product.name,
                },
            });
            return;
        }

        if (product.automatically) {
            console.log(`@@@ GAME ORDER OTOMATIS ${order.game} ${order.productName} total ${orderDetail.quantity}`);
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.PROCESSING,
                },
            });
            for (let i = 0; i < orderDetail.quantity; i++) {
                const createTrxApiGames = await apiGamesService.createTransaction({
                    invoiceId: `${order.invoiceId}_${i}`,
                    productCode: product.code,
                    userId: orderDetail.userId,
                    serverId: orderDetail.serverId || "",
                });
                console.log(createTrxApiGames);
                await sleep(500);
            }
            return;
        }

        // TODO ORDER SESUAI GAME
        // .....
        // TODO ORDER SESUAI GAME

        io.emit("order:success", order.id);
    } else {
        await invoiceService.updateBy({
            by: "id",
            value: invoice.id,
            data: {
                status: InvoiceStatuses.FAILED,
            },
        });

        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.FAILED,
            },
        });

        io.emit("order:failed", order.id);
    }
};

export const webhookEwallet: IApiRouter = {
    path,
    method,
    main,
    auth,
};
