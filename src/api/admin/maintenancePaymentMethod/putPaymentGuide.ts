import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { RequestHandler } from "express";
import Joi from "joi";

const path = "/v1/payment/:id";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

const schemaValidationBody = Joi.object({
    paymentGuide: Joi.string().required(),
});
const schemaValidationParam = Joi.object({
    id: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const body = new ValidatorV2(req, res).process<{
        paymentGuide: string;
    }>(schemaValidationBody, ValidatorType.BODY);
    const param = new ValidatorV2(req, res).process<{
        id: string;
    }>(schemaValidationParam, ValidatorType.PARAMS);
    const paymentMethodService = new PaymentMethodService();
    const paymentMethod = await paymentMethodService.findOneBy({
        column: "id",
        value: param.id,
    });

    if (!paymentMethod) {
        throw new BusinessError(`Metode Pembayaran dengan id ${param.id} tidak ditemukan`, ErrorType.BadRequest);
    }

    await paymentMethodService.updateBy({
        by: "id",
        value: paymentMethod.id,
        data: {
            paymentGuide: body.paymentGuide,
        },
    });

    res.sendStatus(200);
};

export const putPaymentGuide: IApiRouter = {
    main,
    path,
    method,
    auth,
};
