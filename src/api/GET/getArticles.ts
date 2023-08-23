import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { ArticleService } from "@serviceInternal/article.service";

const path = "/v1/newest-articles";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "limit",
        type: "number",
        default: 3,
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        limit: number;
    }>(schemaValidation, ValidatorType.QUERY);
    console.log(query.limit);

    const articleService = new ArticleService();
    const getLastarticle = await articleService.findLastArticleAndTotalComments({
        max: query.limit,
        attributes: ["id", "slug", "title", "publishDate", "img", "externalUrl", "isExternal"],
    });

    res.send(getLastarticle);
};

export const getLastArticels: IApiRouter = {
    path,
    method,
    main,
    auth,
};
