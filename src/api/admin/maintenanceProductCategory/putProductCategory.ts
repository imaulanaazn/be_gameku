import { ErrorType, ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/product-category";
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
        name: "gameId",
        type: "string",
        required: true,
    },
    {
        name: "productsId",
        type: "array",
        required: true,
        items: {
            name: "productsId",
            type: "string",
            required: true,
        },
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        name: string;
        gameId: string;
        productsId: string[];
    }>(schemaValidation, ValidatorType.BODY);
    const productCategoryService = new ProductCategoryService();
    const productCategory = await productCategoryService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!productCategory) {
        throw new BusinessError("Product Category tidak valid", ErrorType.NotFound);
    }

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: body.gameId,
    });

    if (!game) {
        throw new BusinessError("Game ID tidak valid", ErrorType.NotFound);
    }

    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            categoryId: productCategory.id,
        },
    });

    for (const product of products) {
        await productService.updateBy({
            by: "id",
            value: product.id,
            data: {
                categoryId: null,
            },
        });
    }

    const productsId = products.map((item) => item.id);
    if (productsId.length <= 0) {
        res.sendStatus(200);
        return;
    }

    for (const productId of productsId) {
        await productService.updateBy({
            by: "id",
            value: productId,
            data: {
                categoryId: productCategory.id,
            },
        });
    }

    return res.sendStatus(200);
};

export const putProductCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
