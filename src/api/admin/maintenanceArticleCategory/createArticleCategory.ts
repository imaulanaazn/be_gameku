// import { RequestHandler } from "express";
// import { IApiRouter, Validation } from "@interfaces/index";
// import { BusinessError } from "@helper/handleError";
// import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
// import { v4 as uuid } from "uuid";
// import { ValidatorV2 } from "@helper/validatorV2";
// import Joi from "joi";
// import { Op } from "sequelize";

// const path = "/v1/article-category";
// const method = APIMethod.POST;
// const auth = APIAuth.WRITER;

// const schemaValidation = Joi.object({
//     name: Joi.string().required(),
//     slug: Joi.string().required(),
//     description: Joi.string().optional(),
// });

// const main: RequestHandler = async (req, res) => {
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
//             deleted: {
//                 [Op.in]: [null, false],
//             },
//         },
//     });

//     if (checkSlug) {
//         throw new BusinessError("Slug untuk artikel kategori sudah ada", ErrorType.BadRequest);
//     }

//     await di.articleCategoryService.create({
//         id: uuid(),
//         name,
//         slug,
//         description,
//         deleted: false,
//     });

//     return res.sendStatus(200);
// };

// export const createArticleCategory: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
