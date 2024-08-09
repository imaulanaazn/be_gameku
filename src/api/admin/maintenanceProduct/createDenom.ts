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
const method = APIMethod.POST;
const auth = APIAuth.ADMIN;

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
        name: "digiflazzPrice",
        type: "string",
        required: false,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
    },
    {
        name: "status",
        type: "string",
        required: false,
        enum: ["active", "archive"],
    },
    {
        name: "provider",
        type: "string",
        required: true,
    },
    {
        name: "categoryId",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        name: string;
        priceBuy: string;
        code: string;
        price: string;
        digiflazzPrice: string;
        gameId: "true" | "false";
        status: "active" | "archive";
        provider: string;
        categoryId: string;
    }>(schemaValidation, ValidatorType.BODY);
    const file = req.file;
    console.log(body);
    console.log(file);

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: body.gameId,
    });

    if (!game) {
        throw new BusinessError("Game tidak valid", ErrorType.BadRequest);
    }

    let uploadLogoDenom = null;
    if (file) {
        const firebaseService = new FirebaseService();
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
    const productService = new ProductService();
    const product = await productService.create({
        id: uuid(),
        name: body.name,
        code: body.code,
        price: parseInt(body.price),
        priceBuy: parseInt(body.priceBuy),
        logoDenom: uploadLogoDenom,
        gameId: game.id,
        isDisplayed: body.status === "active",
        deleted: false,
        resellerPrice: prices - discReseller,
        categoryId: null,
        digiflazzPrice: parseInt(body.digiflazzPrice) || 0,
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
