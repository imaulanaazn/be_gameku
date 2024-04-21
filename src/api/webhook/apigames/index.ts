import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { APIGamesStatuses, OrderStatuses } from "@enum/index";
import dayjs from "dayjs";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { Config } from "@config/index";

const path = "/v1/webhook/apigames";
const method = "POST";
const auth = "webhook-apigames";

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

    const order = await orderService.findOneBy({
        column: "invoiceId",
        value: invoiceId,
    });

    if (!order) {
        console.log("@@ Error Order tidak valid dengan invoice ID = " + invoiceId);
        return;
    }

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
            },
        });
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
        io.emit("order:success", order.id);

        client.sendNotifyOrder({
            targetNumber: customer.mobileNumber,
            message: whatsappTemplate,
            isTest: false,
            data: {
                invoiceId: order.invoiceId,
                link: `${config.feUrl}/payment/${order.invoiceId}`,
                quantity: orderDetail.quantity || 1,
                mobileNumber: customer.mobileNumber,
                amount: orderDetail.amount,
                game: order.game,
                productName: order.productName,
                paymentMethod: order.paymentMethod,
                feeAmt: order.feeAmt,
                totalAmt: order.totalAmt,
                discAmt: order.discAmt,
            },
        });
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
