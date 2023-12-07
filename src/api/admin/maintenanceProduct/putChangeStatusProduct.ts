import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";

const path = "/v1/denom/archive";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "productId",
        type: "array",
        required: true,
        items: {
            name: "productId",
            type: "string",
            required: true,
        },
    },
    {
        name: "status",
        type: "string",
        required: true,
        enum: ["active", "archive"],
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        productId: string[];
        status: "active" | "archive";
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    const productService = new ProductService();
    await productService.updateBy({
        by: "id",
        value: body.productId,
        data: {
            isActive: body.status === "active",
        },
    });
    res.sendStatus(200);
};

export const putArchiveProduct: IApiRouter = {
    path,
    method,
    main,
    auth,
};
