import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { DiscountType, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { PromotionService } from "@serviceInternal/promotion.service";
import dayjs from "dayjs";
import { PromotionDto } from "@dto/promotion.dto";
import { BusinessError } from "@helper/handleError";
import { GameService } from "@serviceInternal/game.service";

const path = "/v1/promo-code";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
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
        id: string;
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
    console.log(body);
    const promotionService = new PromotionService();
    const check = await promotionService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!check) {
        throw new BusinessError("Kode Promo tidak valid", ErrorType.BadRequest);
    }

    if (check.gameId && check.gameId !== body.gameId) {
        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: body.gameId,
        });

        if (!game) {
            throw new BusinessError("Game tidak valid, silahkan refresh dan coba lagi", ErrorType.BadRequest);
        }
    }

    await promotionService.updateBy({
        by: "id",
        value: body.id,
        data: {
            code: body.code,
            stock: body.stock,
            name: body.name,
            gameId: body.gameId || check.gameId,
            discountType: DiscountType[body.discType],
            discountValue: body.discValue,
            minPurchase: body.minPurchase || check.minPurchase,
            maxDiscount: body.maxDiscount || check.maxDiscount,
            description: body.description || check.description,
            startAt: dayjs(body.startAt).toDate(),
            endAt: dayjs(body.endAt).toDate(),
        },
    });

    res.sendStatus(200);
};

export const putPromotion: IApiRouter = {
    path,
    method,
    main,
    auth,
};
