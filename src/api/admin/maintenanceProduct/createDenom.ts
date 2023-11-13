import { ErrorType, ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v1/denom";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "priceBuy",
        type: "string",
        required: true,
    },
    {
        name: "code",
        type: "string",
        required: true,
    },
    {
        name: "price",
        type: "string",
        required: false,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        name: string;
        priceBuy: string;
        code: string;
        price: VoucherType;
        gameId: "true" | "false";
    }>(schemaValidation, ValidatorType.BODY);
    const file = req.file;

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: body.gameId,
    });

    if (!game) {
        throw new BusinessError("Game tidak valid", ErrorType.BadRequest);
    }

    let uploadLogoDenom = null;
    if (file && file["logoDenom"]) {
        const firebaseService = new FirebaseService();
        uploadLogoDenom = await firebaseService.uploadImg(
            file["logoDenom"].path,
            "banner/" + file["logoDenom"].filename,
        );
        if (!uploadLogoDenom) {
            throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
        }
    }

    const productService = new ProductService();
    const product = await productService.create({
        id: uuid(),
        name: body.name,
        code: body.code,
        price: parseInt(body.price),
        priceBuy: parseInt(body.priceBuy),
        logoDenom: uploadLogoDenom,
        gameId: game.id,
        deleted: false,
    });

    return res.send(product);
};

export const createDenom: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        single: true,
        field: "logoDenom",
    },
};
