import { SocialMediaDto } from "@dto/socialMedia.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";
import { RequestHandler } from "express";

const path = "/v1/sosmed";
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

    const sosmedService = new SocialMediaService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const sosmed = await sosmedService.findManyByPagination(
            {
                column: column[0] as keyof SocialMediaDto,
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
            data: sosmed.rows,
            page: query.page,
            total: sosmed.count,
            totalPage: Math.ceil(sosmed.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }
    const sosmed = await sosmedService.findAllPagination({
        page: query.page,
        sort: query.sort,
        order: query.order,
        limit: query.limit,
    });

    return res.send({
        data: sosmed.data,
        page: query.page,
        total: sosmed.total,
        totalPage: Math.ceil(sosmed.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllSocialMediaPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
