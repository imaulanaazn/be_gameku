import { RequestHandler } from "express";

import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, OrderStatuses } from "@enum/index";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { InvoiceService } from "@serviceInternal/invoice.service";

const path = "/v1/webhook/ewallet";
const method = "POST";
const auth = "webhook-xendit";

const main: RequestHandler = async (req, res) => {
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

    if (order.totalAmt !== body.data.charge_amount) {
        console.log(`Amount berbeda, seharusnya: ${order.totalAmt}, dibayarkan: ${body.data.charge_amount}`);
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

    if (body.data.status === "SUCCEEDED") {
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
    } else if (body.data.status === "FAILED") {
        await invoiceService.updateBy({
            by: "id",
            value: invoice.id,
            data: {
                status: OrderStatuses.FAILED,
            },
        });

        await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
                status: OrderStatuses.FAILED,
            },
        });
    }

    res.sendStatus(200);
};

export const webhookEwallet: IApiRouter = {
    path,
    method,
    main,
    auth,
};
