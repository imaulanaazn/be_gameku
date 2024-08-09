import { ProductDto } from "@dto/product.dto";
import { GameEntity } from "@entity/game.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { RequestHandler } from "express";
import { Op, col, fn } from "sequelize";

const path = "/v1/dropdown-product-category";
const method = APIMethod.GET;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const productCategoryService = new ProductCategoryService();
    const productCategories = await productCategoryService.model.findAll({
        attributes: ["id", "name"],
    });

    return res.send(productCategories);
};

export const dropdownProductCategoryPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
