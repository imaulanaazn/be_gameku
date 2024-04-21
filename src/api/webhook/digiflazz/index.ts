import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { OrderStatuses, DigiflazzStatuses } from "@enum/index";
import dayjs from "dayjs";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { Config } from "@config/index";

const path = "/v1/webhook/digiflazz";
const method = "POST";
const auth = "webhook-digiflazz";

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body: {
        data: {
            trx_id: string;
            ref_id: string;
            customer_no: string;
            buyer_sku_code: string;
            message: string;
            status: string;
            rc: string;
            buyer_last_saldo: number;
            sn: string;
            price: number;
            tele: string;
            wa: string;
        };
    } = req.body;
    const orderId = body.data.ref_id.split("_")[0];
    const event = req.headers["X-Digiflazz-Event"];
    const count = parseInt(body.data.ref_id.split("_")[1]) + 1;
    console.log(`Webhook DIGIFLAZZ diterima [${orderId}] part ${count}`);
    console.log(JSON.stringify(body));

    const orderService = new OrderService();
    const orderDetailService = new OrderDetailService();
    const customerService = new CustomerService();
    const whatsappTemplateService = new WhatsappTemplateService();
    const config = new Config();

    const order = await orderService.findOneBy({
        column: "id",
        value: orderId,
    });

    if (!order) {
        console.log("@@ Error Order tidak valid dengan ID = " + orderId);
        return;
    }

    const orderDetail = await orderDetailService.findOneBy({
        column: "orderId",
        value: order.id,
    });
    const webhookCount = (orderDetail.webhookCount ?? 0) + 1;
    console.log(`Webhook DIGIFLAZZ diterima [${orderId}] ${webhookCount} dari ${orderDetail.quantity}`);

    const customer = await customerService.findOneBy({
        column: "id",
        value: order.customerId,
    });

    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "order_success",
    });

    if (body.data.status === DigiflazzStatuses.FAILED) {
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

    if (event === "update" && body.data.status === DigiflazzStatuses.SUCCESS && webhookCount < orderDetail.quantity) {
        await orderDetailService.updateBy({
            by: "id",
            value: orderDetail.id,
            data: {
                webhookCount,
            },
        });
        return;
    }

    if (event === "update" && body.data.status === DigiflazzStatuses.SUCCESS && webhookCount >= orderDetail.quantity) {
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

export const webhookDigiflazz: IApiRouter = {
    path,
    method,
    main,
    auth,
};
