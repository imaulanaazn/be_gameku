import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";

const path = "/v1/banner";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [];

const main: RequestHandler = async (req, res) => {
    const pagination = new Validator(req, res).process(schemaValidation, ValidatorType.QUERY, true);
    console.log(pagination);
    const bannerService = new BannerService();
    const banners = await bannerService.findAllPagination(pagination);

    res.send({
        totalPage: Math.ceil(banners.total / pagination.limit),
        firstPage: 1,
        page: pagination.page,
        totalData: banners.total,
        data: banners.data,
    });
};

export const listBannerPagination: IApiRouter = {
    path,
    method,
    main,
    auth,
};
