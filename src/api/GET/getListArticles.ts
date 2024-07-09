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

const path = "/v1/articles";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
    }, "Boolean String Validation")
    .optional();

const schemaValidation = Joi.object({
    categorySlug: Joi.string().optional(),
    isPopular: booleanStringSchema,
    title: Joi.string().optional(),
});

const main: RequestHandler = async (req, res) => {
    const query = new ValidatorV2(req, res).process<{
        categorySlug: string;
        isPopular: boolean;
        title: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const di = req.di;
    const { sort, limit, order, page, ...filteredQuery } = query;

    let articleIds: any = [];
    if (query.categorySlug) {
        const categoryArticle = await di.articleCategoryService.model.findOne({
            where: {
                slug: query.categorySlug,
            },
            include: [
                {
                    model: ArticleCategoryArticleEntity,
                    required: true,
                },
            ],
        });

        if (!categoryArticle) {
            throw new BusinessError("Kategory Artikel tidak valid", ErrorType.NotFound);
        }

        const articleId = await di.articleCategoryArticleService.model.findAll({
            where: {
                articleCategoryId: categoryArticle.id,
            },
            attributes: ["articleId"],
        });

        if (articleId.length === 0) {
            return res.send({
                data: [],
                page: query.page,
                total: 0,
                totalPage: Math.ceil(0 / query.limit),
                order: query.order,
                sort: query.sort,
                limit: query.limit,
            });
        }

        articleIds = articleId.map((item) => item.articleId);
    }

    const articles = await di.articleService.model.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        where: {
            status: "PUBLISH",
            ...(query.isPopular ? { isPopular: query.isPopular } : {}),
            ...(articleIds.length > 0 ? { id: { [Op.in]: articleIds } } : {}),
            ...(query.title ? { title: { [Op.like]: `%${query.title}%` } } : {}),
        },
        order: [[sort, order]],
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

    const imageUrl = di.config.imageUrl;
    const newDataPromises = articles.rows.map(async (article) => {
        const bannerData = article.images.find((image) => image.type === "banner");
        const bannerImage = bannerData
            ? `${imageUrl}/${article.images.find((image) => image.type === "banner").path}`
            : "";
        const categories = article.articleCategoryArticles.map((category) => ({
            id: category.articleCategory.id,
            name: category.articleCategory.name,
            slug: category.articleCategory.slug,
        }));

        const contentPreview = await di.minioService.getFile({
            bucketName: "gasskeuntopup",
            filename: article.contentPreview,
            result: "string",
        });

        return {
            id: article.id,
            author: article.author.name,
            title: article.title,
            slug: article.slug,
            contentPreview,
            status: article.status,
            isPopular: article.isPopular,
            bannerImage,
            buttons: article.buttons,
            categories,
            publishedAt: article.publishedAt,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
        };
    });

    const newData = await Promise.all(newDataPromises);

    return res.send({
        data: newData,
        page: query.page,
        total: articles.count,
        totalPage: Math.ceil(articles.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getListArticles: IApiRouter = {
    path,
    method,
    main,
    auth,
};
