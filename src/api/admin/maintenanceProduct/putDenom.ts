import { ErrorType, ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { ProductService } from "@serviceInternal/product.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/denom";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

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
    {
        name: "status",
        type: "string",
        required: false,
        enum: ["active", "archive"],
    },
    {
        name: "digiflazzPrice",
        type: "string",
        required: false,
    },
    // {
    //     name: "provider",
    //     type: "string",
    //     required: true,
    // },
    // {
    //     name: "categoryId",
    //     type: "string",
    //     required: true,
    // },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        name: string;
        priceBuy: string;
        code: string;
        price: VoucherType;
        gameId: "true" | "false";
        status: "active" | "archive";
        digiflazzPrice: string;
        // provider: string;
        // categoryId: string;
    }>(schemaValidation, ValidatorType.BODY);
    const file = req.file;
    console.log(body);
    console.log(file);
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

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findOneBy({
        column: "cd",
        value: "percentage_prices_reseller",
    });

    const prices = parseInt(body.price);
    const discReseller = (prices * parseInt(sysConfig.value)) / 100;
    const dataUpdate = {
        name: body.name,
        code: body.code,
        price: parseInt(body.price),
        priceBuy: parseInt(body.priceBuy),
        logoDenom: uploadLogoDenom,
        gameId: body.gameId,
        isDisplayed: body.status === "active",
        deleted: false,
        resellerPrice: prices - discReseller,

        // categoryId: body.categoryId,
    };

    await productService.updateBy({
        by: "id",
        value: body.id,
        data: {
            ...dataUpdate,
            digiflazzPrice: parseInt(body.digiflazzPrice),
        },
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
