import { ArticleButtonDto } from "@dto/articleButton.dto";
import { ArticleCategoryArticleDto } from "@dto/articleCategoryArticle.dto";
import { ArticleImageDto } from "@dto/articleImage.dto";
import { AdminUserRoleEntity } from "@entity/AdminUserRole";
import { AdminEntity } from "@entity/admin.entity";
import { AdminRoleEntity } from "@entity/adminRole.entity";
import { ArticleButtonEntity } from "@entity/articleButton.entity";
import { ArticleCategoryEntity } from "@entity/articleCategory.entity";
import { ArticleCategoryArticleEntity } from "@entity/articleCategoryArticle.entity";
import { ArticleImageEntity } from "@entity/articleImage.entity";
import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import Joi from "joi";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";

const path = "/v1/article/:id";
const method = APIMethod.PUT;
const auth = APIAuth.WRITER;

const arrayStringSchema = Joi.string()
    .custom((value, helpers) => {
        try {
            const parsedValue = JSON.parse(value);
            if (!Array.isArray(parsedValue)) {
                return helpers.error("any.only");
            }
            return parsedValue;
        } catch (err) {
            return helpers.error("string.json");
        }
    }, "Array String Validation")
    .messages({
        "string.base": "Must be a string",
        "string.json": "Invalid JSON format",
        "any.only": "Must be a valid array format",
    });

const booleanStringSchema = Joi.string()
    .valid("true", "false")
    .messages({
        "string.base": "Must be a string",
        "any.only": 'Must be either "true" or "false"',
    })
    .custom((value, helpers) => {
        if (value === "true" || value === "false") {
            return value === "true";
        } else {
            return helpers.error("any.only");
        }
    }, "Boolean String Validation");

const schemaValidation = Joi.object({
    title: Joi.string().required(),
    slug: Joi.string().required(),
    content: Joi.string().required(),
    contentPreview: Joi.string().required(),
    button: arrayStringSchema,
    categoryIds: arrayStringSchema,
    status: Joi.string().allow("DRAFT", "PUBLISH", "ARCHIVE").required(),
    isPopular: booleanStringSchema,
});

const schemaValidation2 = Joi.object({
    id: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const param = new ValidatorV2(req, res).process<{
        id: string;
    }>(schemaValidation2, ValidatorType.PARAMS);

    const body = new ValidatorV2(req, res).process<{
        title: string;
        slug: string;
        content: string;
        contentPreview: string;
        button?: string;
        categoryIds?: string;
        status: "DRAFT" | "PUBLISH" | "ARCHIVE";
        isPopular: boolean;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(req.files);
    console.log(body);
    const di = req.di;

    const checkSlug = await di.articleService.model.findOne({
        where: {
            slug: body.slug,
            id: {
                [Op.ne]: param.id,
            },
        },
    });

    if (checkSlug) {
        throw new BusinessError(`Duplikat slug ${body.slug}`, ErrorType.Duplicate);
    }

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

    const formatName = `${uuid()}-${dayjs().format("YYYY-MM-DD")}`;
    const newContentFilename = `content-${formatName}.html`;
    const newContentPreviewFilename = `content-preview-${formatName}.html`;
    const uploadNewContent = di.minioService.uploadFile({
        bucketName: "gasskeuntopup",
        filename: newContentFilename,
        folder: "article",
        fileBuffer: Buffer.from(body.content, "utf-8"),
    });
    const uploadNewContentPreview = di.minioService.uploadFile({
        bucketName: "gasskeuntopup",
        filename: newContentPreviewFilename,
        folder: "article",
        fileBuffer: Buffer.from(body.contentPreview, "utf-8"),
    });

    const uploadPromises = [uploadNewContent, uploadNewContentPreview];
    await di.articleService.updateBy({
        by: "id",
        value: article.id,
        data: {
            title: body.title,
            slug: body.slug,
            content: `article/${newContentFilename}`,
            contentPreview: `article/${newContentPreviewFilename}`,
            status: body.status,
            publishedAt: body.status === "PUBLISH" ? dayjs().toDate() : null,
            isPopular: body.isPopular,
        },
    });

    if (req?.file?.fieldname === "banner") {
        const articleImageBefore = article.images.find((item) => item.type === "banner")?.path;
        if (articleImageBefore) {
            await di.minioService.deleteFile({
                bucketName: "gasskeuntopup",
                filename: articleImageBefore,
            });
        }
        await di.minioService.uploadFile({
            bucketName: "gasskeuntopup",
            filename: req.file.filename,
            folder: "article-image",
            filePath: req.file.path,
        });

        await di.articleImageService.updateBy({
            by: "id",
            value: article.id,
            data: {
                path: `article-image/${req.file.filename}`,
            },
        });
    }

    await Promise.all(uploadPromises);

    if (body?.button) {
        const buttons: { name: string; url: string }[] = JSON.parse(body.button);
        const dataButton: ArticleButtonDto[] = buttons.map((button) => ({
            id: uuid(),
            articleId: article.id,
            name: button.name,
            url: button.url,
        }));
        await di.articleButtonService.model.bulkCreate(dataButton);
    }

    if (body?.categoryIds) {
        const categoryIds: string[] = JSON.parse(body.categoryIds);
        const articleCategory = await di.articleCategoryService.model.findAll({
            where: {
                id: {
                    [Op.in]: categoryIds,
                },
            },
        });

        if (articleCategory.length > 0) {
            const dataCategory: ArticleCategoryArticleDto[] = articleCategory.map((articleCategory) => ({
                id: uuid(),
                articleId: article.id,
                articleCategoryId: articleCategory.id,
            }));

            await di.articleCategoryArticleService.model.bulkCreate(dataCategory);
        }
    }

    const deletedMinioFilename = [article.content, article.contentPreview];
    const deleteBulkMinioFile = deletedMinioFilename.map((item) => {
        di.minioService.deleteFile({
            bucketName: "gasskeuntopup",
            filename: item,
        });
    });
    await Promise.all(deleteBulkMinioFile);

    const oldButtonIds = article.buttons.map((item) => item.id);
    if (oldButtonIds.length > 0) {
        await di.articleButtonService.model.destroy({
            where: {
                id: {
                    [Op.in]: oldButtonIds,
                },
            },
        });
    }

    const categoryIds = article.articleCategoryArticles.map((item) => item.id);
    if (categoryIds.length > 0) {
        await di.articleCategoryArticleService.model.destroy({
            where: {
                id: {
                    [Op.in]: categoryIds,
                },
            },
        });
    }
    res.sendStatus(200);
};

export const updateArticle: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        field: "banner",
        single: true,
    },
};
