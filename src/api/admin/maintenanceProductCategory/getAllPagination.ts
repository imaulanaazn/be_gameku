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

const path = "/v1/product-category";
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
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const gameService = new GameService();
    const productCategoryService = new ProductCategoryService();
    const productService = new ProductService();
    const orderDetailService = new OrderDetailService();
    const column = Object.keys(query);

    let where: any = {};
    if (column.length > 4) {
        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const productCategories = await productCategoryService.model.findAndCountAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        order: [[query.sort, query.order]],
        where: {
            ...where,
        },
    });

    // const productCategoriesId = productCategories.rows.map(item => item.id)
    // const products = await productService.model.findAndCountAll({
    //     where: {
    //         categoryId: productCategoriesId
    //     }
    // })

    // const gameId = products.rows[0]?.gameId
    // let game
    // if(gameId) {
    //     game = await gameService.findOneBy({
    //         column: "id",
    //         value: gameId
    //     })
    // }

    return res.send({
        data: productCategories.rows,
        page: query.page,
        total: productCategories.count,
        totalPage: Math.ceil(productCategories.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllProductCategoryPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
