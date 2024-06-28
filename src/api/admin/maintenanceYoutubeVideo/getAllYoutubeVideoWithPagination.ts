import { BannerDto } from "@dto/banner.dto";
import { VideoDto } from "@dto/video.dto";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { VideoService } from "@serviceInternal/video.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/youtube";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "title",
        type: "string",
        required: false,
    },
    {
        name: "author",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        title?: string;
        author?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const videoService = new VideoService();
    const column = Object.keys(query);

    let where: any = {};
    if (column.length > 4) {
        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const datas = await videoService.model.findAndCountAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        order: [[query.sort, query.order]],
        where,
    });

    return res.send({
        data: datas.rows,
        page: query.page,
        total: datas.count,
        totalPage: Math.ceil(datas.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllYoutubeVideoPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
