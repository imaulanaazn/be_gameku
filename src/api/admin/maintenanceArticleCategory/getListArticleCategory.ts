import { APIMethod, APIAuth, ValidatorType } from "@enum/index";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import Joi from "joi";
import { Op } from "sequelize";

const path = "/v1/article-category";
const method = APIMethod.GET;
const auth = APIAuth.WRITER;

const schemaValidation = Joi.object({
    name: Joi.string().optional(),
});

const main: RequestHandler = async (req, res) => {
    const query = new ValidatorV2(req, res).process<{
        name: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const di = req.di;
    const { sort, limit, order, page, ...filteredQuery } = query;

    const where: any = {};
    for (const key of Object.keys(filteredQuery)) {
        where[key] = { [Op.like]: `%${filteredQuery[key]}%` };
    }

    const articleCategories = await di.articleCategoryService.model.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        where: {
            deleted: {
                [Op.or]: [null, false],
            },
        },
        order: [[sort, order]],
    });

    return res.send({
        data: articleCategories.rows,
        page: query.page,
        total: articleCategories.count,
        totalPage: Math.ceil(articleCategories.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getListArticleCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
