import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { ProductEntity } from "@entity/product.entity";

const path = "/v1/products";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "productId",
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
    const query = new Validator(req, res).process<{
        productId: string;
        gameId: string;
    }>(schemaValidation, ValidatorType.QUERY);

    if (!query.gameId && !query.productId) {
        throw new BusinessError(
            "Setidaknya query param harus ada salah satu dari product ID atau game ID",
            ErrorType.Validation,
        );
    }

    const productService = new ProductService();

    let products: ProductEntity | ProductEntity[];
    if (query.gameId) {
        products = await productService.model.findAll({
            where: {
                gameId: query.gameId,
                isActive: true,
                deleted: false,
                isDisplayed: true,
            },
        });

        if (!products.length) {
            throw new BusinessError(`Produk dengan game ID: ${query.gameId} tidak ditemukan`, ErrorType.NotFound);
        }
    } else {
        products = await productService.model.findOne({
            where: {
                id: query.productId,
                isActive: true,
                deleted: false,
                isDisplayed: true,
            },
        });

        if (!products) {
            throw new BusinessError(`Produk dengan produk ID: ${query.productId} tidak ditemukan`, ErrorType.NotFound);
        }
    }

    return res.send(products);
};

export const getProducts: IApiRouter = {
    main,
    path,
    method,
    auth,
};
