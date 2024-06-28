import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";

const path = "/v1/denom-bulk/:id";
const method = APIMethod.DELETE;
const auth = APIAuth.ADMIN;

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

    const productService = new ProductService();
    await productService.updateBy({
        by: "id",
        value: productId,
        data: {
            deleted: true,
        },
    });
    res.sendStatus(200);
};

export const deleteProduct: IApiRouter = {
    path,
    method,
    main,
    auth,
};
