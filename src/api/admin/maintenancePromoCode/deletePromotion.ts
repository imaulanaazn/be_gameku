import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { PromotionService } from "@serviceInternal/promotion.service";
import { RequestHandler } from "express";

const path = "/v1/promo-code/:id";
const method = "DELETE";
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
    const id = param.id.split(",");

    const promotionService = new PromotionService();
    await promotionService.updateBy({
        by: "id",
        value: id,
        data: {
            deleted: true,
        },
    });

    res.sendStatus(200);
};

export const deletePromotion: IApiRouter = {
    path,
    method,
    main,
    auth,
};
