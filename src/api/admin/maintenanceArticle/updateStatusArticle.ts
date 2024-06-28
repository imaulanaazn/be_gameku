import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import Joi from "joi";

const path = "/v1/article-status/:id";
const method = APIMethod.PUT;
const auth = APIAuth.WRITER;

const schemaValidation = Joi.object({
    id: Joi.string().required(),
});
const schemaValidation2 = Joi.object({
    status: Joi.string().allow("DRAFT", "PUBLISH", "ARCHIVE").required(),
});

const main: RequestHandler = async (req, res) => {
    const param = new ValidatorV2(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const body = new ValidatorV2(req, res).process<{
        status: string;
    }>(schemaValidation2, ValidatorType.BODY);
    const di = req.di;
    const article = await di.articleService.model.findOne({
        where: {
            id: param.id,
        },
    });

    if (!article) {
        throw new BusinessError("Artikel tidak ditemukan", ErrorType.NotFound);
    }

    await di.articleService.updateBy({
        by: "id",
        value: param.id,
        data: {
            status: body.status,
            ...(body.status === "PUBLISH" ? { publishedAt: dayjs().toDate() } : {}),
        },
    });

    res.sendStatus(200);
};

export const updateStatusArticle: IApiRouter = {
    path,
    method,
    main,
    auth,
};
