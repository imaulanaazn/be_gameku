import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { BusinessError } from "@helper/handleError";
import { ErrorType, InvoiceStatuses } from "@enum/index";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { Config } from "@config/index";
import { OrderEntity } from "@entity/order.entity";
import { CustomerEntity } from "@entity/customer.entity";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/webhook/tokopay";
const method = APIMethod.POST;
const auth = APIAuth.WEBHOOK_TOKOPAY;

interface PaymentData {
    created_at: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string;
    merchant_id: string;
    payment_channel: string;
    total_dibayar: number;
    total_diterima: number;
    updated_at: string;
}

interface PaymentResponse {
    data: PaymentData;
    reference: string;
    reff_id: string;
    signature: string;
    status: string;
}

const main: RequestHandler = async (req, res) => {
    const body: PaymentResponse = req.body;
    console.log(`WEBHOOK ${body.data.payment_channel} diterima [${body.reff_id}]`);
    console.log(JSON.stringify(body));

    const config = new Config();
    const orderService = new OrderService();
    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.model.findOne({
        where: {
            id: body.reff_id,
        },
        include: [
            {
                model: OrderEntity,
                required: true,
                include: [
                    {
                        model: CustomerEntity,
                        required: true,
                    },
                ],
            },
        ],
    });

    if (!invoice) {
        throw new BusinessError(`Invoice tidak ditemukan dengan invoice: ${body.reff_id}`, ErrorType.Internal);
    }

    res.send({ status: true });

    if ((body.status === "Success" || body.status === "Completed") && invoice.status !== InvoiceStatuses.PAID) {
        const res = await fetch(`http://localhost:${config.port}/api/v1/gasskeun/process-order-success`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-gasskeun-key": config.xApiKeyProcessOrder,
            },
            body: JSON.stringify({
                customerId: invoice.order.customer.id,
                orderId: invoice.order.id,
                invoiceId: invoice.id,
            }),
        });

        console.log(await res.text());

        return;
    }
};

export const webhookTokopay: IApiRouter = {
    path,
    method,
    main,
    auth,
};
