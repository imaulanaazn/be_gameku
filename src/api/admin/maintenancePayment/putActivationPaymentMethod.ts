import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";

const path = "/v1/payment-method/activation";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "array",
        required: true,
        items: {
            name: "id",
            type: "string",
            required: true,
        },
    },
    {
        name: "isActive",
        type: "boolean",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string[];
        isActive: boolean;
    }>(schemaValidation, ValidatorType.BODY);

    const paymentMethodService = new PaymentMethodService();
    await paymentMethodService.updateBy({
        by: "id",
        value: body.id,
        data: {
            isActive: body.isActive,
        },
    });

    res.sendStatus(200);
};

export const putActivationPaymentMethod: IApiRouter = {
    path,
    method,
    main,
    auth,
};
