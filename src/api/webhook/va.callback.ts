import { RequestHandler } from "express";

import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, OrderStatuses } from "@enum/index";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { InvoiceService } from "@serviceInternal/invoice.service";

const path = "/v1/webhook/va";
const method = "POST";
const auth = "webhook-xendit";

const main: RequestHandler = async (req, res) => {
    const body: {
        id: string;
        payment_id: string;
        callback_virtual_account_id: string;
        owner_id: string;
        external_id: string;
        account_number: string;
        bank_code: string;
        transaction_timestamp: string;
        amount: number;
        merchant_code: string;
        currency: string;
        country: string;
        sender_name: string;
        payment_detail: {
            payment_interface: string;
            remark: string;
            reference: string;
            sender_account_number: string;
            sender_channel_code: string;
            sender_name: string;
            transfer_method: string;
        };
    } = req.body;
    console.log(`Webhook VA diterima [${body.external_id}]`);
    console.log(JSON.stringify(body));

    const orderService = new OrderService();
    const productService = new ProductService();
    const invoiceService = new InvoiceService();

    const invoice = await invoiceService.findOneBy({
        column: "id",
        value: body.external_id,
    });

    if (!invoice) {
        throw new BusinessError(`Order tidak ditemukan dengan invoice: ${body.external_id}`, ErrorType.Internal);
    }

    const order = await orderService.findOneBy({
        column: "invoiceId",
        value: invoice.id,
    });

    if (order.totalAmt !== body.amount) {
        console.log(`Amount berbeda, seharusnya: ${order.totalAmt}, dibayarkan: ${body.amount}`);
        console.log(`Memproses update order partial paid`);
        await invoiceService.updateBy({
            by: "id",
            value: invoice.id,
            data: {
                status: OrderStatuses.PARTIAL_PAID,
            },
        });

        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.PARTIAL_PAID,
            },
        });
        return res.sendStatus(200);
    }
    console.log("Data berhasil divalidasi, memproses update order");

    // TODO ORDER SESUAI GAME
    // .....
    // TODO ORDER SESUAI GAME

    // console.log(`Berhasil order untuk game ${product.name}`);

    await invoiceService.updateBy({
        by: "id",
        value: invoice.id,
        data: {
            status: OrderStatuses.PAID,
        },
    });

    await orderService.updateBy({
        by: "id",
        value: order.id,
        data: {
            status: OrderStatuses.PAID,
            completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    });

    res.sendStatus(200);
};

export const webhookVirtualAccount: IApiRouter = {
    path,
    method,
    main,
    auth,
};
