import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";

const path = "/v1/banners";
const method = "GET";
const auth = "guess";

const main: RequestHandler = async (req, res) => {
    const bannerService = new BannerService();
    const banners = await bannerService.findAll();
    res.send(banners);
};

export const getBanners: IApiRouter = {
    path,
    method,
    main,
    auth,
};
