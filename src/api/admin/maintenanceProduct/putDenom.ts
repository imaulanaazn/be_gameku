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
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
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
        required: true,
    },
    {
        name: "gameId",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        name: string;
        priceBuy: string;
        code: string;
        price: VoucherType;
        gameId: "true" | "false";
    }>(schemaValidation, ValidatorType.BODY);
    const file = req.file;
    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!product) {
        throw new BusinessError("Denom tidak valid", ErrorType.BadRequest);
    }

    if (product.gameId !== body.gameId) {
        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: body.gameId,
        });

        if (!game) {
            throw new BusinessError("Game tidak valid", ErrorType.BadRequest);
        }
    }

    let uploadLogoDenom = null;
    const firebaseService = new FirebaseService();
    if (file && product.logoDenom) {
        uploadLogoDenom = await firebaseService.updateImg(file.path, product.logoDenom, "denom/" + file.filename);
        if (!uploadLogoDenom) {
            throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
        }
    } else if (file) {
        uploadLogoDenom = await firebaseService.uploadImg(file.path, "denom/" + file.filename);
        if (!uploadLogoDenom) {
            throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
        }
    }

    const dataUpdate = {
        name: body.name,
        code: body.code,
        price: parseInt(body.price),
        priceBuy: parseInt(body.priceBuy),
        logoDenom: uploadLogoDenom || product.logoDenom,
        gameId: body.gameId,
    };

    await productService.updateBy({
        by: "id",
        value: body.id,
        data: dataUpdate,
    });

    return res.send({
        id: product.id,
        ...dataUpdate,
    });
};

export const putDenom: IApiRouter = {
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
