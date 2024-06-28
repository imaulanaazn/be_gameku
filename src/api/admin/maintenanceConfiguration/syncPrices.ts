import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { ProductService } from "@serviceInternal/product.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";

const path = "/v1/product-prices";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "percentage",
        type: "number",
        required: true,
    },
    {
        name: "type",
        type: "string",
        required: true,
        enum: ["reseller", "user"],
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        percentage: number;
        type: "reseller" | "user";
    }>(schemaValidation, ValidatorType.BODY);

    const productService = new ProductService();
    const products = await productService.model.scope("withPriceBuy").findAll({
        where: {
            deleted: false,
        },
    });

    // const newData = products.map((product) => {
    //     return {
    //         ...(body.type === "reseller" && {
    //             resellerPrice: product.price + (product.price * body.percentage) / 100,
    //         }),
    //         ...(body.type === "user" && { price: product.price + (product.price * body.percentage) / 100 }),
    //     };
    // });

    const sysConfigService = new SysConfigService();
    await sysConfigService.updateBy({
        by: "cd",
        value: "percentage_prices",
        data: {
            value: body.percentage.toString(),
        },
    });
    res.sendStatus(200);
    for (const product of products) {
        productService.updateBy({
            by: "id",
            value: product.id,
            data: {
                ...(body.type === "reseller" && {
                    resellerPrice: product.priceBuy + (product.priceBuy * body.percentage) / 100,
                }),
                ...(body.type === "user" && { price: product.priceBuy + (product.priceBuy * body.percentage) / 100 }),
            },
        });
    }

    return;
};

export const putProductPrices: IApiRouter = {
    main,
    path,
    method,
    auth,
};
