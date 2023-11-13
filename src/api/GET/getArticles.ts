import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { ArticleService } from "@serviceInternal/article.service";

const path = "/v1/newest-articles";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process(schemaValidation, ValidatorType.QUERY, true);
    if (query.sort === "createdAt") {
        query.sort = "publishDate";
    }

    const articleService = new ArticleService();
    const getLastarticle = await articleService.findLastArticleAndTotalComments({
        attributes: ["id", "slug", "title", "publishDate", "img", "externalUrl", "isExternal"],
        pagination: {
            limit: query.limit,
            page: query.page,
            order: query.order,
            sort: query.sort,
        },
    });

    const countArticles = await articleService.countArticles();

    res.send({ data: getLastarticle, totalData: countArticles });
};

export const getLastArticels: IApiRouter = {
    path,
    method,
    main,
    auth,
};
