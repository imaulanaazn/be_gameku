import { RequestHandler } from "express";

import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, OrderStatuses } from "@enum/index";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { InvoiceService } from "@serviceInternal/invoice.service";

const path = "/v1/webhook/retail";
const method = "POST";
const auth = "webhook-xendit";

const main: RequestHandler = async (req, res) => {
    const body: {
        id: string;
        external_id: string;
        prefix: string;
        payment_code: string;
        retail_outlet_name: string;
        name: string;
        amount: number;
        status: string;
        transaction_timestamp: string;
        payment_id: string;
        fixed_payment_code_payment_id: string;
        fixed_payment_code_id: string;
        owner_id: string;
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
