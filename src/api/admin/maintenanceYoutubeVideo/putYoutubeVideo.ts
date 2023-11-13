import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { VideoService } from "@serviceInternal/video.service";
import { BusinessError } from "@helper/handleError";
import { v4 as uuid } from "uuid";

const path = "/v1/youtube";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "urlVideo",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        urlVideo: string;
    }>(schemaValidation, ValidatorType.BODY);

    const youtubeService = new VideoService();
    const getData = await youtubeService.getData(body.urlVideo);
    if (!getData) {
        throw new BusinessError("Url Video tidak valid, silahkan check kembali", ErrorType.BadRequest);
    }

    const checkVideo = await youtubeService.findOneBy({
        column: "id",
        value: body.id,
    });
    if (!checkVideo) {
        throw new BusinessError("Data tidak valid silahkan refresh dan coba lagi", ErrorType.BadRequest);
    }
    const regex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|watch|.*[?&]v=|.*[?&]vi=))|youtu\.be\/)([^"&?/\s]{11})/i;
    await youtubeService.updateBy({
        by: "id",
        value: body.id,
        data: {
            title: getData.title,
            author: getData.author_name,
            authorUrl: getData.author_url,
            url: body.urlVideo,
            videoId: body.urlVideo.match(regex)[1],
        },
    });

    res.sendStatus(200);
};

export const putYoutubeVideo: IApiRouter = {
    path,
    method,
    main,
    auth,
};
