import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { DiscountType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { PromotionService } from "@serviceInternal/promotion.service";
import dayjs from "dayjs";
import { PromotionDto } from "@dto/promotion.dto";

const path = "/v1/promo-code";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "code",
        type: "string",
        required: true,
    },
    {
        name: "stock",
        type: "number",
        required: false,
        default: null,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
        default: null,
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
        default: 0,
    },
    {
        name: "maxDiscount",
        type: "number",
        required: false,
        default: 0,
    },
    {
        name: "description",
        type: "string",
        required: false,
        default: null,
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
        gameId?: string;
        name: string;
        discType: "PERCENTAGE" | "AMOUNT";
        discValue: number;
        minPurchase?: number;
        maxDiscount?: number;
        description?: string;
        startAt: string;
        endAt: string;
    }>(schemaValidation, ValidatorType.BODY);

    const promotionService = new PromotionService();
    const data: PromotionDto = {
        id: uuid(),
        code: body.code,
        name: body.name,
        gameId: body.gameId || null,
        discountType: DiscountType[body.discType],
        discountValue: body.discValue,
        minPurchase: body.minPurchase || 0,
        maxDiscount: body.maxDiscount || 0,
        description: body.description || null,
        startAt: dayjs(body.startAt).toDate(),
        endAt: dayjs(body.endAt).toDate(),
        deleted: false,
    };

    await promotionService.create(data);

    res.sendStatus(200);
};

export const createPromotion: IApiRouter = {
    path,
    method,
    main,
    auth,
};
