// import { RequestHandler } from "express";
// import { IApiRouter } from "@interfaces/index";
// import { BusinessError } from "@helper/handleError";
// import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
// import { ValidatorV2 } from "@helper/validatorV2";
// import Joi from "joi";
// import { Op } from "sequelize";

// const path = "/v1/article-category/:id";
// const method = APIMethod.PUT;
// const auth = APIAuth.WRITER;

// const schemaValidation = Joi.object({
//     name: Joi.string().required(),
//     slug: Joi.string().required(),
//     description: Joi.string().optional(),
// });

// const schemaValidation2 = Joi.object({
//     id: Joi.string().required(),
// });

// const main: RequestHandler = async (req, res) => {
//     const param = new ValidatorV2(req, res).process<{
//         id: string;
//     }>(schemaValidation2, ValidatorType.PARAMS);
//     const body = new ValidatorV2(req, res).process<{
//         name: string;
//         slug: string;
//         description: string;
//     }>(schemaValidation, ValidatorType.BODY);

//     const di = req.di;
//     const { name, slug, description } = body;
//     const checkSlug = await di.articleCategoryService.model.findOne({
//         where: {
//             slug: body.slug,
//             id: {
//                 [Op.ne]: param.id,
//             },
//             deleted: {
//                 [Op.in]: [null, false],
//             },
//         },
//     });

//     if (checkSlug) {
//         throw new BusinessError("Slug untuk artikel kategori sudah ada", ErrorType.BadRequest);
//     }

//     const checkArticleCategory = await di.articleCategoryService.model.findOne({
//         where: {
//             id: param.id,
//             deleted: {
//                 [Op.in]: [null, false],
//             },
//         },
//     });

//     if (!checkArticleCategory) {
//         throw new BusinessError("Artikel kategory tidak valid", ErrorType.NotFound);
//     }

//     await di.articleCategoryService.updateBy({
//         by: "id",
//         value: param.id,
//         data: {
//             name,
//             slug,
//             description,
//         },
//     });

//     return res.sendStatus(200);
// };

// export const updateArticleCategory: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
