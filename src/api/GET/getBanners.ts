import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { APIAuth, APIMethod } from "@enum/index";
import { BannerDto } from "@dto/banner.dto";

const path = "/v1/banners";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const di = req.di;
    const redisKey = "banners";
    const dataFromRedis = await di.redisService.getObject<BannerDto[]>(redisKey);
    if (dataFromRedis && dataFromRedis.length > 0) {
        return res.send(dataFromRedis);
    }

    const bannerService = new BannerService();
    const banners = await bannerService.findAll();

    await di.redisService.setObject(redisKey, banners);

    res.send(banners);
};

export const getBanners: IApiRouter = {
    path,
    method,
    main,
    auth,
};
