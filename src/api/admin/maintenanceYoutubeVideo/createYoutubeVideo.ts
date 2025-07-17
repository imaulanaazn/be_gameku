// import { RequestHandler } from "express";
// import { IApiRouter, Validation } from "@interfaces/index";
// import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
// import { Validator } from "@helper/validator";
// import { VideoService } from "@serviceInternal/video.service";
// import { BusinessError } from "@helper/handleError";
// import { v4 as uuid } from "uuid";

// const path = "/v1/youtube";
// const method = APIMethod.POST;
// const auth = APIAuth.ADMIN;

// const schemaValidation: Validation[] = [
//     {
//         name: "urlVideo",
//         type: "string",
//         required: true,
//     },
// ];

// const main: RequestHandler = async (req, res) => {
//     const body = new Validator(req, res).process<{
//         urlVideo: string;
//     }>(schemaValidation, ValidatorType.BODY);
//     console.log(body);
//     const youtubeService = new VideoService();
//     const getData = await youtubeService.getData(body.urlVideo);
//     if (!getData) {
//         throw new BusinessError("Url Video tidak valid, silahkan check kembali", ErrorType.BadRequest);
//     }
//     const regex =
//         /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|watch|.*[?&]v=|.*[?&]vi=))|youtu\.be\/)([^"&?/\s]{11})/i;
//     const newData = await youtubeService.create({
//         id: uuid(),
//         title: getData.title,
//         author: getData.author_name,
//         authorUrl: getData.author_url,
//         url: body.urlVideo,
//         videoId: body.urlVideo.match(regex)[1],
//     });

//     res.send(newData);
// };

// export const createYoutubeVideo: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
