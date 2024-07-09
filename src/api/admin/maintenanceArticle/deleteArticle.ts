import { AdminEntity } from "@entity/admin.entity";
import { ArticleButtonEntity } from "@entity/articleButton.entity";
import { ArticleCategoryEntity } from "@entity/articleCategory.entity";
import { ArticleCategoryArticleEntity } from "@entity/articleCategoryArticle.entity";
import { ArticleImageEntity } from "@entity/articleImage.entity";
import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import Joi from "joi";
import { Op } from "sequelize";

const path = "/v1/article/:id";
const method = APIMethod.DELETE;
const auth = APIAuth.WRITER;

const schemaValidation = Joi.object({
    id: Joi.string().uuid().required(),
});

const main: RequestHandler = async (req, res) => {
    const param = new ValidatorV2(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const di = req.di;
    const article = await di.articleService.model.findOne({
        where: {
            id: param.id,
        },
        include: [
            {
                model: ArticleImageEntity,
                required: false,
            },
            {
                model: ArticleButtonEntity,
                required: false,
                attributes: ["id", "name", "url"],
            },
            {
                model: ArticleCategoryArticleEntity,
                required: false,
                include: [
                    {
                        model: ArticleCategoryEntity,
                        required: false,
                    },
                ],
            },
            {
                model: AdminEntity,
                required: true,
            },
        ],
    });

    if (!article) {
        throw new BusinessError("Artikel tidak ditemukan", ErrorType.NotFound);
    }

    await di.articleButtonService.deleteBy({
        by: "articleId",
        value: article.id,
    });

    await di.articleCategoryArticleService.deleteBy({
        by: "articleId",
        value: article.id,
    });

    await di.articleImageService.deleteBy({
        by: "articleId",
        value: article.id,
    });

    const minioFiles = [article.content, article.contentPreview];

    for (const image of article.images) {
        minioFiles.push(image.path);
    }

    for (const file of minioFiles) {
        di.minioService.deleteFile({
            bucketName: "gasskeuntopup",
            filename: file,
        });
    }

    await di.articleService.deleteBy({
        by: "id",
        value: article.id,
    });

    return res.sendStatus(200);
};

export const deleteArticle: IApiRouter = {
    path,
    method,
    main,
    auth,
};
