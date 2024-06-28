import { ArticleButtonDto } from "@dto/articleButton.dto";
import { ArticleCategoryArticleDto } from "@dto/articleCategoryArticle.dto";
import { ArticleImageDto } from "@dto/articleImage.dto";
import { AdminUserRoleEntity } from "@entity/AdminUserRole";
import { AdminRoleEntity } from "@entity/adminRole.entity";
import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import Joi from "joi";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";

const path = "/v1/article";
const method = APIMethod.POST;
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

const main: RequestHandler = async (req, res) => {
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
    const admin = req.admin.data;

    const checkSlug = await di.articleService.model.findOne({
        where: {
            slug: body.slug,
        },
    });

    if (checkSlug) {
        throw new BusinessError(`Duplikat slug ${body.slug}`, ErrorType.Duplicate);
    }

    const formatName = `${uuid()}-${dayjs().format("YYYY-MM-DD")}`;
    const contentFilename = `content-${formatName}.html`;
    const contentPreviewFilename = `content-preview-${formatName}.html`;
    const uploadContent = di.minioService.uploadFile({
        bucketName: "gasskeuntopup",
        filename: contentFilename,
        folder: "article",
        fileBuffer: Buffer.from(body.content, "utf-8"),
    });
    const uploadContentPreview = di.minioService.uploadFile({
        bucketName: "gasskeuntopup",
        filename: contentPreviewFilename,
        folder: "article",
        fileBuffer: Buffer.from(body.contentPreview, "utf-8"),
    });

    const uploadPromises = [uploadContent, uploadContentPreview];

    const articleId = uuid();
    await di.articleService.create({
        id: articleId,
        authorId: admin.id,
        title: body.title,
        slug: body.slug,
        content: `article/${contentFilename}`,
        contentPreview: `article/${contentPreviewFilename}`,
        status: body.status,
        publishedAt: body.status === "PUBLISH" ? dayjs().toDate() : null,
        isPopular: body.isPopular,
    });

    const savedArticleImage: ArticleImageDto[] = [];
    if (req.files && !Array.isArray(req.files)) {
        if (req.files?.banner) {
            const uploadBanner = di.minioService.uploadFile({
                bucketName: "gasskeuntopup",
                filename: req.files.banner[0].filename,
                folder: "article-image",
                filePath: req.files.banner[0].path,
            });
            uploadPromises.push(uploadBanner);
            savedArticleImage.push({
                id: uuid(),
                articleId: articleId,
                path: `article-image/${req.files.banner[0].filename}`,
                type: "banner",
            });
        }

        if (req.files?.imageContent) {
            const uploadImageContentPromises = req.files.imageContent.map((image) => {
                savedArticleImage.push({
                    id: uuid(),
                    articleId: articleId,
                    path: `article-image/${image.filename}`,
                    type: "image_content",
                });

                return di.minioService.uploadFile({
                    bucketName: "gasskeuntopup",
                    filename: image.filename,
                    folder: "article-image",
                    filePath: image.path,
                });
            });
            uploadPromises.push(...uploadImageContentPromises);
        }
    }

    await Promise.all(uploadPromises);
    if (savedArticleImage.length > 0) {
        await di.articleImageService.model.bulkCreate(savedArticleImage);
    }

    if (body?.button) {
        const buttons: { name: string; url: string }[] = JSON.parse(body.button);
        const dataButton: ArticleButtonDto[] = buttons.map((button) => ({
            id: uuid(),
            articleId,
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
                articleId,
                articleCategoryId: articleCategory.id,
            }));

            await di.articleCategoryArticleService.model.bulkCreate(dataCategory);
        }
    }

    res.sendStatus(200);
};

export const postArticle: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        field: ["imageContent", "banner"],
        single: false,
    },
};
