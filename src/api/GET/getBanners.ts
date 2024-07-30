import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { APIAuth, APIMethod } from "@enum/index";
import RedisService from "@serviceExternal/externalRedis.service";
import { BannerDto } from "@dto/banner.dto";

const path = "/v1/banners";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const redisKey = "banners";
    const redisService = new RedisService();
    const dataFromRedis = await redisService.getJson<BannerDto[]>(redisKey);
    if (dataFromRedis && dataFromRedis.length > 0) {
        return res.send(dataFromRedis);
    }

    const bannerService = new BannerService();
    const banners = await bannerService.findAll();

    await redisService.setJson(redisKey, banners);

    res.send(banners);
};

export const getBanners: IApiRouter = {
    path,
    method,
    main,
    auth,
};
