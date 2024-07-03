import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod } from "@enum/index";
import { ValidatorV2 } from "@helper/validatorV2";
import Joi from "joi";
import { getIpAddress } from "@helper/getIpAddress";
import { v4 as uuid } from "uuid";

const path = "/v1/article-comment";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

const schemaValidation = Joi.object({
    articleId: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    content: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const clientIp = getIpAddress(req);
    console.log(req.header("x-forwarded-for"));
    const body = new ValidatorV2(req, res).process<{
        articleId: string;
        name: string;
        email: string;
        content: string;
    }>(schemaValidation, ValidatorType.BODY);
    const di = req.di;
    const { articleId, name, email, content } = body;

    const article = await di.articleService.model.findOne({
        where: {
            id: articleId,
        },
    });

    if (!article) {
        throw new BusinessError("Artikel tidak ditemukan", ErrorType.NotFound);
    }

    await di.articleCommentService.create({
        id: uuid(),
        email,
        articleId,
        name,
        content,
        status: "active",
        ip: clientIp,
    });

    res.sendStatus(200);
    return;
};

export const postArticleComment: IApiRouter = {
    path,
    method,
    main,
    auth,
};
