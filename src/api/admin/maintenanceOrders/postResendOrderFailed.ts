import { Config } from "@config/index";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { OrderService } from "@serviceInternal/order.service";
import { RequestHandler } from "express";

const path = "/v1/order/resend";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "orderId",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        orderId: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);

    const config = new Config();
    const orderService = new OrderService();
    const order = await orderService.findOneBy({
        column: "id",
        value: body.orderId,
    });

    if (!order) {
        throw new BusinessError("Pesanan tidak valid", ErrorType.BadRequest);
    }

    try {
        await fetch(`http://localhost:${config.port}/api/v1/gasskeun/process-order-success`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-gasskeun-key": config.xApiKeyProcessOrder,
            },
            body: JSON.stringify({
                customerId: order.customerId,
                orderId: order.id,
                invoiceId: order.invoiceId,
            }),
        });
    } catch (error) {
        throw error;
    }

    await orderService.updateBy({
        by: "id",
        value: order.id,
        data: {
            isCanResend: false,
        },
    });

    return res.sendStatus(200);
};

export const postResendOrderFailed: IApiRouter = {
    path,
    method,
    main,
    auth,
};
