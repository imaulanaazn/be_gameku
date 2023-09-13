import { BannerDto } from "@dto/banner.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { BannerService } from "@serviceInternal/banner.service";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { RequestHandler } from "express";

const path = "/v1/banner";
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

    const bannerService = new BannerService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const banner = await bannerService.findManyByPagination(
            {
                column: column[0] as keyof BannerDto,
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
            data: banner.rows,
            page: query.page,
            total: banner.count,
            totalPage: Math.ceil(banner.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const banner = await bannerService.findAllPagination({
        page: query.page,
        sort: query.sort,
        order: query.order,
        limit: query.limit,
    });

    return res.send({
        data: banner.data,
        page: query.page,
        total: banner.total,
        totalPage: Math.ceil(banner.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllBannerPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
