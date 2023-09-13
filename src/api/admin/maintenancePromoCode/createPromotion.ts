import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { DiscountType, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { PromotionService } from "@serviceInternal/promotion.service";
import dayjs from "dayjs";

const path = "/v1/promo-code";
const method = "POST";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "code",
        type: "string",
        required: true,
    },
    {
        name: "stock",
        type: "number",
        required: true,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
    },
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "discType",
        type: "string",
        required: true,
        enum: ["PERCENTAGE", "AMOUNT"],
    },
    {
        name: "discValue",
        type: "number",
        required: true,
    },
    {
        name: "minPurchase",
        type: "number",
        required: false,
    },
    {
        name: "description",
        type: "string",
        required: true,
    },
    {
        name: "description",
        type: "string",
        required: true,
    },
    {
        name: "startAt",
        type: "string",
        required: true,
    },
    {
        name: "endAt",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        code: string;
        stock: number;
        gameId: string;
        name: string;
        discType: "PERCENTAGE" | "AMOUNT";
        discValue: number;
        minPurchase: number;
        description: string;
        startAt: string;
        endAt: string;
    }>(schemaValidation, ValidatorType.BODY);

    const promotionService = new PromotionService();
    await promotionService.create({
        id: uuid(),
        code: body.code,
        gameId: body.gameId,
        name: body.name,
        discountType: DiscountType[body.discType],
        discountValue: body.discValue,
        minPurchase: body.minPurchase | 0,
        description: body.description,
        startAt: dayjs(body.startAt).toDate(),
        endAt: dayjs(body.endAt).toDate(),
        deleted: false,
    });

    res.sendStatus(200);
};

export const createPromotion: IApiRouter = {
    path,
    method,
    main,
    auth,
};
