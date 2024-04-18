import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { RequestHandler } from "express";

const path = "/v1/product-category/:id";
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
    const productId = param.id.split(",");

    const productCategoryService = new ProductCategoryService();
    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            categoryId: param.id,
        },
    });

    if (products.length > 0) {
        await productCategoryService.deleteBy({
            by: "id",
            value: param.id,
        });
        res.sendStatus(200);
        return;
    }

    const productsId = products.map((item) => item.id);
    for (const productId of productsId) {
        await productService.updateBy({
            by: "id",
            value: productId,
            data: {
                categoryId: null,
            },
        });
    }

    await productCategoryService.deleteBy({
        by: "id",
        value: param.id,
    });
    res.sendStatus(200);
};

export const deleteProductCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
