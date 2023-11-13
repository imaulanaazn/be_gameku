import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Validator } from "@helper/validator";
import { BannerService } from "@serviceInternal/banner.service";
import { VideoService } from "@serviceInternal/video.service";

const path = "/v1/youtube/:id";
const method = "DELETE";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);

    const ids = body.id.split(",");

    const youtubeService = new VideoService();
    const videos = await youtubeService.findManyBy({
        column: "id",
        value: ids,
        operator: "in",
    });

    if (videos.length === 0) {
        throw new BusinessError("Videos tidak ditemukan dengan id " + body.id, ErrorType.BadRequest);
    }

    await youtubeService.deleteBy({
        by: "id",
        value: ids,
        operator: "in",
    });
    return res.sendStatus(200);
};

export const deleteYoutubeVideo: IApiRouter = {
    path,
    method,
    main,
    auth,
};
