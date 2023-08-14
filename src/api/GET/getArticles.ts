import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { ArticleService } from "@serviceInternal/article.service";
import { CommentService } from "@serviceInternal/comment.service";

const path = "/v1/newest-articles";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "max",
        type: "number",
        default: 3,
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        max: number;
    }>(schemaValidation, ValidatorType.QUERY);

    const articleService = new ArticleService();
    const getLastarticle = await articleService.findLastArticleAndTotalComments({
        max: query.max,
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
