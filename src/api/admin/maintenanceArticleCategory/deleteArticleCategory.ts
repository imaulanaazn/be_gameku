import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { ValidatorV2 } from "@helper/validatorV2";
import Joi from "joi";
import { Op } from "sequelize";

const path = "/v1/article-category/:id";
const method = APIMethod.DELETE;
const auth = APIAuth.WRITER;

const schemaValidation2 = Joi.object({
    id: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const param = new ValidatorV2(req, res).process<{
        id: string;
    }>(schemaValidation2, ValidatorType.PARAMS);

    const di = req.di;
    const checkArticleCategory = await di.articleCategoryService.model.findOne({
        where: {
            id: param.id,
            deleted: {
                [Op.in]: [null, false],
            },
        },
    });

    if (!checkArticleCategory) {
        throw new BusinessError("Artikel kategory tidak valid", ErrorType.NotFound);
    }

    await di.articleCategoryService.updateBy({
        by: "id",
        value: param.id,
        data: {
            deleted: true,
        },
    });

    return res.sendStatus(200);
};

export const deleteArticleCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
