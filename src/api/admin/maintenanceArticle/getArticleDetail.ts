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

const path = "/v1/article/:id";
const method = APIMethod.GET;
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
                attributes: ["name", "url"],
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

    const imageUrl = di.config.imageUrl;
    const bannerData = article.images.find((image) => image.type === "banner");
    const bannerImage = bannerData ? `${imageUrl}/${article.images.find((image) => image.type === "banner").path}` : "";

    const contentImageDatas = article.images.filter((image) => !(image.type === "banner"));
    const contentImage =
        contentImageDatas.length > 0 ? contentImageDatas.map((image) => `${imageUrl}/${image.path}`) : [];

    const categories = article.articleCategoryArticles.map((category) => ({
        name: category.articleCategory.name,
        slug: category.articleCategory.slug,
    }));

    const contentPreview = await di.minioService.getFile({
        bucketName: "gasskeuntopup",
        filename: article.contentPreview,
        result: "string",
    });

    const content = await di.minioService.getFile({
        bucketName: "gasskeuntopup",
        filename: article.content,
        result: "string",
    });

    return res.send({
        id: article.id,
        author: article.author.name,
        title: article.title,
        slug: article.slug,
        content,
        contentPreview,
        status: article.status,
        isPopular: article.isPopular,
        bannerImage,
        contentImage,
        buttons: article.buttons,
        categories,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
    });
};

export const getArticleDetail: IApiRouter = {
    path,
    method,
    main,
    auth,
};
