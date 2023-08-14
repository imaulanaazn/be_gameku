import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";

const path = "/v1/activate-payment/:id";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);

    const paymentMethodService = new PaymentMethodService();
    const paymentMethod = await paymentMethodService.findOneBy({ column: "id", value: param.id });
    if (!paymentMethod) {
        throw new BusinessError("Payment method tidak valid dengan id " + param.id, ErrorType.BadRequest);
    }

    await paymentMethodService.updateBy({
        by: "id",
        value: param.id,
        data: {
            isActive: !paymentMethod.isActive,
        },
    });

    res.send({
        ...paymentMethod.dataValues,
        isActive: !paymentMethod.isActive,
    });
};

export const activationPaymentMethod: IApiRouter = {
    path,
    method,
    main,
    auth,
};
