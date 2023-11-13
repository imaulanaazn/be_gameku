// import { RequestHandler } from "express";
// import { ErrorType, ValidatorType } from "@enum/index";
// import moment from "moment";
// import { v4 as uuid } from "uuid";
// import { BusinessError } from "@helper/handleError";
// import { Validation, IApiRouter } from "@interfaces/index";
// import { Validator } from "@helper/validator";
// import generateSlug from "@helper/generateSlug";
// import { ArticleService } from "@serviceInternal/article.service";
// import { ArticleDto } from "@dto/article.dto";
// import { FirebaseService } from "@serviceExternal/firebase.service";

// const path = "/v1/article";
// const method = "POST";
// const auth = "admin";

// const schemaValidation: Validation[] = [
//     {
//         name: "title",
//         required: true,
//         type: "string",
//     },
//     {
//         name: "content",
//         required: false,
//         type: "string",
//     },
//     {
//         name: "category",
//         required: false,
//         type: "string",
//     },
//     {
//         name: "isExternal",
//         required: true,
//         type: "string",
//         enum: ["true", "false"],
//     },
//     {
//         name: "externalUrl",
//         required: false,
//         type: "string",
//     },
//     {
//         name: "isPublished",
//         required: false,
//         type: "string",
//         default: false,
//         enum: ["true", "false"],
//     },
// ];
// const main: RequestHandler = async (req, res) => {
//     const body = new Validator(req, res).process<{
//         title: string;
//         content?: string;
//         category: string;
//         isExternal: boolean;
//         externalUrl: string;
//         isPublished: boolean;
//     }>(schemaValidation, ValidatorType.BODY);
//     body["isExternal"] = (body.isExternal as any) === "true";
//     body["isPublished"] = (body.isPublished as any) === "true";

//     if (body.isExternal && !body.externalUrl) {
//         throw new BusinessError("Harus ada external url ketika memilih article dari external", ErrorType.Validation);
//     }

//     if (!body.isExternal && !body.content) {
//         throw new BusinessError("Harus ada konten ketika memilih article dari internal", ErrorType.Validation);
//     }

//     if (!req.file) {
//         throw new BusinessError("Tidak ada file yang di upload", ErrorType.Validation);
//     }

//     const articleSevice = new ArticleService();
//     let slug = generateSlug(body.title);
//     const articles = await articleSevice.findOneBy({
//         column: "slug",
//         value: slug,
//         only: ["id"],
//     });

//     if (articles) {
//         throw new BusinessError("Silahkan gunakan judul yang unik, karena judul ini sudah ada", ErrorType.Validation);
//     }

//     const firebaseService = new FirebaseService();
//     const uploadImage = await firebaseService.uploadImg(req.file.path, "article/" + req.file.filename);
//     if (!uploadImage) {
//         throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
//     }

//     let bodyArticle: ArticleDto = {
//         id: uuid(),
//         title: body.title,
//         img: uploadImage,
//         category: body.category,
//         isExternal: body.isExternal,
//         slug: slug,
//         isPublished: body.isPublished,
//         content: !body.isExternal && body.content,
//     };

//     if (body.isPublished) {
//         bodyArticle.publishDate = moment().toDate();
//     }

//     if (!body.isExternal) {
//         bodyArticle.content = body.content;
//     }

//     const newArticle = await articleSevice.create(bodyArticle);
//     return res.send(newArticle);
// };

// export const postArticle: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
//     isUploadImage: true,
//     dataImg: {
//         field: "imageArticle",
//     },
// };
