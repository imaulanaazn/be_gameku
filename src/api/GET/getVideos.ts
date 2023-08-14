import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { VideoService } from "@serviceInternal/video.service";

const path = "/v1/videos";
const method = "GET";
const auth = "guess";

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
