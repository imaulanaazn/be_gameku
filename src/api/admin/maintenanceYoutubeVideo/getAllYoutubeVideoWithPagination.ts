import { BannerDto } from "@dto/banner.dto";
import { VideoDto } from "@dto/video.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { VideoService } from "@serviceInternal/video.service";
import { RequestHandler } from "express";

const path = "/v1/youtube";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const videoService = new VideoService();
    const bannerService = new BannerService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const videos = await videoService.findManyByPagination(
            {
                column: column[0] as keyof VideoDto,
                value: `%${query[column[0]]}%`,
                operator: "like",
            },
            {
                page: query.page,
                sort: query.sort,
                order: query.order,
                limit: query.limit,
            },
        );

        return res.send({
            data: videos.rows,
            page: query.page,
            total: videos.count,
            totalPage: Math.ceil(videos.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const videos = await videoService.findAllPagination({
        page: query.page,
        sort: query.sort,
        order: query.order,
        limit: query.limit,
    });

    return res.send({
        data: videos.data,
        page: query.page,
        total: videos.total,
        totalPage: Math.ceil(videos.total / query.limit),
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
