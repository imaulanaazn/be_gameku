// import { AdminEntity } from "@entity/admin.entity";
// import { ArticleButtonEntity } from "@entity/articleButton.entity";
// import { ArticleCategoryEntity } from "@entity/articleCategory.entity";
// import { ArticleCategoryArticleEntity } from "@entity/articleCategoryArticle.entity";
// import { ArticleImageEntity } from "@entity/articleImage.entity";
// import { APIMethod, APIAuth, ValidatorType } from "@enum/index";
// import { ValidatorV2 } from "@helper/validatorV2";
// import { IApiRouter } from "@interfaces/index";
// import { RequestHandler } from "express";
// import Joi from "joi";
// import { Op } from "sequelize";

// const path = "/v1/article";
// const method = APIMethod.GET;
// const auth = APIAuth.WRITER;

// const booleanStringSchema = Joi.string()
//     .valid("true", "false")
//     .messages({
//         "string.base": "Must be a string",
//         "any.only": 'Must be either "true" or "false"',
//     })
//     .custom((value, helpers) => {
//         if (value === "true" || value === "false") {
//             return value === "true";
//         } else {
//             return helpers.error("any.only");
//         }
//     }, "Boolean String Validation")
//     .optional();

// const schemaValidation = Joi.object({
//     title: Joi.string().optional(),
//     slug: Joi.string().optional(),
//     status: Joi.string().allow("DRAFT", "PUBLISH", "ARCHIVE").optional(),
//     isPopular: booleanStringSchema,
// });

// const main: RequestHandler = async (req, res) => {
//     const query = new ValidatorV2(req, res).process<{
//         title: string;
//         slug: string;
//         status: "DRAFT" | "PUBLISH" | "ARCHIVE";
//         isPopular: boolean;
//     }>(schemaValidation, ValidatorType.QUERY, true);
//     const di = req.di;
//     const { sort, limit, order, page, ...filteredQuery } = query;

//     const where: any = {};
//     for (const key of Object.keys(filteredQuery)) {
//         if (key === "isPopular") {
//             where[key] = filteredQuery[key];
//         } else {
//             where[key] = { [Op.like]: `%${filteredQuery[key]}%` };
//         }
//     }

//     const articles = await di.articleService.model.findAndCountAll({
//         limit,
//         offset: (page - 1) * limit,
//         where,
//         order: [[sort, order]],
//         include: [
//             {
//                 model: ArticleImageEntity,
//                 required: false,
//             },
//             {
//                 model: ArticleButtonEntity,
//                 required: false,
//                 attributes: ["id", "name", "url"],
//             },
//             {
//                 model: ArticleCategoryArticleEntity,
//                 required: false,
//                 include: [
//                     {
//                         model: ArticleCategoryEntity,
//                         required: false,
//                     },
//                 ],
//             },
//             {
//                 model: AdminEntity,
//                 required: true,
//             },
//         ],
//     });

//     const newDataPromises = articles.rows.map(async (article) => {
//         const imageUrl = di.config.imageUrl;
//         const bannerData = article.images.find((image) => image.type === "banner");
//         const bannerImage = bannerData
//             ? `${imageUrl}/${article.images.find((image) => image.type === "banner").path}`
//             : "";

//         const contentImageDatas = article.images.filter((image) => !(image.type === "banner"));
//         const contentImage =
//             contentImageDatas.length > 0 ? contentImageDatas.map((image) => `${imageUrl}/${image.path}`) : [];

//         const categories = article.articleCategoryArticles.map((category) => ({
//             id: category.articleCategory.id,
//             name: category.articleCategory.name,
//             slug: category.articleCategory.slug,
//         }));

//         const contentPreview = await di.minioService.getFile({
//             bucketName: "gasskeuntopup",
//             filename: article.contentPreview,
//             result: "string",
//         });

//         return {
//             id: article.id,
//             author: article.author.name,
//             title: article.title,
//             slug: article.slug,
//             contentPreview,
//             status: article.status,
//             isPopular: article.isPopular,
//             bannerImage,
//             contentImage,
//             buttons: article.buttons,
//             categories,
//             publishedAt: article.publishedAt,
//             createdAt: article.createdAt,
//             updatedAt: article.updatedAt,
//         };
//     });

//     const newData = await Promise.all(newDataPromises);

//     return res.send({
//         data: newData,
//         page: query.page,
//         total: articles.count,
//         totalPage: Math.ceil(articles.count / query.limit),
//         order: query.order,
//         sort: query.sort,
//         limit: query.limit,
//     });
// };

// export const getListArticle: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
