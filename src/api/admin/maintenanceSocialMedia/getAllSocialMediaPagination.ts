import { SocialMediaDto } from "@dto/socialMedia.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/sosmed";
const method = "GET";
const auth = "admin";

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
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const sosmedService = new SocialMediaService();
    const column = Object.keys(query);

    let where: any = {};
    if (column.length > 4) {
        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const datas = await sosmedService.model.findAndCountAll({
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

export const getAllSocialMediaPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
