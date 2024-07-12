import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import Joi from "joi";

const path = "/v1/article-comment/:articleId";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation = Joi.object({});
const schemaValidationParam = Joi.object({
    articleId: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const query = new ValidatorV2(req, res).process<{}>(schemaValidation, ValidatorType.QUERY, true);
    const param = new ValidatorV2(req, res).process<{
        articleId: string;
    }>(schemaValidationParam, ValidatorType.PARAMS);
    const di = req.di;
    const { sort, limit, order, page } = query;
    const { articleId } = param;

    const article = await di.articleService.model.findOne({
        where: {
            id: articleId,
        },
    });

    if (!article) {
        throw new BusinessError("Artikel tidak ditemukan", ErrorType.NotFound);
    }

    const comments = await di.articleCommentService.model.findAndCountAll({
        where: {
            articleId: article.id,
            status: "active",
        },
        limit,
        offset: (page - 1) * limit,
        order: [[sort, order]],
        attributes: ["name", "email", "content", "createdAt"],
    });

    return res.send({
        data: comments.rows,
        page: query.page,
        total: comments.count,
        totalPage: Math.ceil(comments.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getArticleComments: IApiRouter = {
    path,
    method,
    main,
    auth,
};
