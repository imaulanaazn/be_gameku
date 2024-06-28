import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { VideoService } from "@serviceInternal/video.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/videos";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const videoService = new VideoService();
    const videos = await videoService.findAll();
    res.send(videos);
};

export const getVideos: IApiRouter = {
    path,
    method,
    main,
    auth,
};
