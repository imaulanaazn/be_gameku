import { PromotionDto } from "@dto/promotion.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { PromotionService } from "@serviceInternal/promotion.service";
import { RequestHandler } from "express";

const path = "/v1/promo-code";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const promotionService = new PromotionService();
    const gameService = new GameService();
    const productService = new ProductService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const promoCode = await promotionService.findManyByPagination(
            {
                column: column[0] as keyof PromotionDto,
                value: `%${query[column[0]]}%`,
                operator: "like",
            },
            {
                page: query.page,
                sort: query.sort,
                order: query.order,
                limit: query.limit,
            },
            {
                column: "deleted",
                value: false,
            },
        );

        return res.send({
            data: promoCode.rows,
            page: query.page,
            total: promoCode.count,
            totalPage: Math.ceil(promoCode.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }
    const promoCode = await promotionService.findAllPagination(
        {
            page: query.page,
            sort: query.sort,
            order: query.order,
            limit: query.limit,
        },
        {
            column: "deleted",
            value: false,
        },
    );

    return res.send({
        data: promoCode.data,
        page: query.page,
        total: promoCode.total,
        totalPage: Math.ceil(promoCode.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllPromoCodePagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
