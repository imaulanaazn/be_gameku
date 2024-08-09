import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { APIAuth, APIGamesStatuses, APIMethod, OrderStatuses, ResponseCodeDigiflazzOrder } from "@enum/index";
import dayjs from "dayjs";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { Config } from "@config/index";
import { OrderEntity } from "@entity/order.entity";
import { sendResponseOrderDigiflazz } from "../digiflazz/sendResponseOrder";
import { PaymentMethodService } from "@serviceInternal/index";
import { v4 as uuid } from "uuid";
import { FundService } from "@serviceInternal/fund.service";

const path = "/v1/webhook/apigames";
const method = APIMethod.POST;
const auth = APIAuth.WEBHOOK_APIGAMES;

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body: {
        merchant_id: string;
        trx_id: string;
        ref_id: string;
        destination: string;
        product_code: string;
        product_code_master: string;
        message: string;
        status: APIGamesStatuses;
        sn: string;
        last_balance: string;
        product_detail: {
            name: string;
            code: string;
            price: number;
            price_unit: string;
            rate: number;
            price_rp: number;
        };
    } = req.body;
    const invoiceId = body.ref_id.split("_")[0];
    const count = parseInt(body.ref_id.split("_")[1]) + 1;
    console.log(`Webhook APIGAMES diterima [${invoiceId}] part ${count} untuk produk ${body.product_detail.name}`);
    console.log(JSON.stringify(body));

    const orderService = new OrderService();
    const orderDetailService = new OrderDetailService();
    const customerService = new CustomerService();
    const whatsappTemplateService = new WhatsappTemplateService();
    const config = new Config();

    const order = await orderService.model.scope("withAmtBuy").findOne({
        where: {
            invoiceId,
        },
    });

    if (!order) {
        console.log("@@ Error Order tidak valid dengan invoice ID = " + invoiceId);
        return;
    }

    const paymentMethodService = new PaymentMethodService();
    const paymentMethod = await paymentMethodService.model.findOne({
        where: {
            id: order.paymentMethodId,
        },
    });

    const orderDetail = await orderDetailService.findOneBy({
        column: "orderId",
        value: order.id,
    });
    const webhookCount = (orderDetail.webhookCount ?? 0) + 1;
    console.log(`Webhook APIGAMES diterima [${invoiceId}] ${webhookCount} dari ${orderDetail.quantity}`);

    const customer = await customerService.findOneBy({
        column: "id",
        value: order.customerId,
    });

    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "order_success",
    });

    if (body.status === APIGamesStatuses.ERROR || body.status === APIGamesStatuses.FAILED) {
        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.FAILED,
                remark: "Failed to process order due to an unknown error",
            },
        });
        if (order.isSellerDigiflazz) {
            await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.FAILED);
        }

        if (paymentMethod.cd !== "GASSKEUN_USER" && paymentMethod.cd !== "GASSKEUN" && !order.isGuest) {
            const fundService = new FundService();
            let fund = await fundService.findOneBy({
                column: "customerId",
                value: customer.id,
            });

            if (!fund) {
                await fundService.create({
                    id: uuid(),
                    customerId: customer.id,
                    name: "Gasskeun Coin",
                    value: 0,
                });

                fund = await fundService.findOneBy({
                    column: "customerId",
                    value: customer.id,
                });
            }
            await fundService.updateBy({
                by: "customerId",
                value: customer.id,
                data: {
                    value: Math.ceil(fund.value + order.amtBuy),
                },
            });
        }

        io.emit("order:failed", order.id);
        return res.sendStatus(200);
    }

    if (body.status === APIGamesStatuses.SUCCESS && webhookCount < orderDetail.quantity) {
        await orderDetailService.updateBy({
            by: "id",
            value: orderDetail.id,
            data: {
                webhookCount,
            },
        });

        if (order.isSellerDigiflazz) {
            await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.PROCESS);
        }

        return;
    }

    if (body.status === APIGamesStatuses.SUCCESS && webhookCount >= orderDetail.quantity) {
        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.SUCCESS,
                completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
        });

        if (order.isSellerDigiflazz) {
            await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.SUCCESS);
        }

        io.emit("order:success", order.id);

        // client.sendNotifyOrder({
        //     targetNumber: customer.mobileNumber,
        //     message: whatsappTemplate,
        //     isTest: false,
        //     data: {
        //         invoiceId: order.invoiceId,
        //         link: `${config.feUrl}/payment/${order.invoiceId}`,
        //         quantity: orderDetail.quantity || 1,
        //         mobileNumber: customer.mobileNumber,
        //         amount: orderDetail.amount,
        //         game: order.game,
        //         productName: order.productName,
        //         paymentMethod: order.paymentMethod,
        //         feeAmt: order.feeAmt,
        //         totalAmt: order.totalAmt,
        //         discAmt: order.discAmt,
        //     },
        // });
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
};

export const webhookApiGames: IApiRouter = {
    path,
    method,
    main,
    auth,
};
