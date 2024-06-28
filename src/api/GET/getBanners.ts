import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/banners";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
