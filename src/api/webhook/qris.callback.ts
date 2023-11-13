import { RequestHandler } from "express";

import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, InvoiceStatuses, OrderStatuses, VoucherType } from "@enum/index";
import { ProductService } from "@serviceInternal/product.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import dayjs from "dayjs";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { GameService } from "@serviceInternal/game.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { CustomerService } from "@serviceInternal/customer.service";

const path = "/v1/webhook/qris";
const method = "POST";
const auth = "webhook-xendit";

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body: {
        created: string;
        business_id: string;
        event: string;
        api_version: string;
        data: {
            amount: number;
            basket: string;
            business_id: string;
            channel_code: string;
            created: string;
            currency: string;
            expires_at: string;
            id: string;
            metadata: string;
            payment_detail: {
                account_details: string;
                name: string;
                receipt_id: string;
                source: string;
            };
            qr_id: string;
            qr_string: string;
            reference_id: string;
            status: string;
            type: string;
        };
    } = req.body;
    console.log(`Webhook QRIS diterima [${body.data.reference_id}]`);
    console.log("Request Body", body);

    const orderService = new OrderService();
    const productService = new ProductService();
    const invoiceService = new InvoiceService();

    const invoice = await invoiceService.findOneBy({
        column: "id",
        value: body.data.reference_id,
    });

    if (!invoice) {
        throw new BusinessError(`Order tidak ditemukan dengan invoice: ${body.data.reference_id}`, ErrorType.Internal);
    }

    const order = await orderService.findOneBy({
        column: "invoiceId",
        value: invoice.id,
    });

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

        // TODO ORDER SESUAI GAME
        // .....
        // TODO ORDER SESUAI GAME

        io.emit("order:success", order.id);
    } else if (body.data.status === "FAILED") {
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

export const webhookQris: IApiRouter = {
    path,
    method,
    main,
    auth,
};
