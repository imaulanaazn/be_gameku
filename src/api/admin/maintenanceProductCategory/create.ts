import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v1/product-category";
const method = APIMethod.POST;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
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
        name: "position",
        type: "number",
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
        name: string;
        gameId: string;
        position: number;
        productsId: string[];
    }>(schemaValidation, ValidatorType.BODY);

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
            id: body.productsId,
        },
    });

    const productsId = products.map((item) => item.id);
    if (productsId.length <= 0) {
        res.sendStatus(200);
        return;
    }

    const productCategoryService = new ProductCategoryService();
    const productCategoryId = uuid();
    await productCategoryService.create({
        id: productCategoryId,
        name: body.name,
        gameId: game.id,
        catSequence: body.position,
    });

    for (const productId of productsId) {
        await productService.updateBy({
            by: "id",
            value: productId,
            data: {
                categoryId: productCategoryId,
            },
        });
    }

    return res.sendStatus(200);
};

export const createProductCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
