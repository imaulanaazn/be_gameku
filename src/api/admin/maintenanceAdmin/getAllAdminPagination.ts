import { Config } from "@config/index";
import { AdminDto } from "@dto/admin.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { AdminService } from "@serviceInternal/admin.service";
import { RequestHandler } from "express";

const path = "/v1/admin/admin";
const method = "GET";
const auth = "super-admin";

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

    const adminService = new AdminService();
    const config = new Config();
    const column = Object.keys(query);

    if (column.length > 4) {
        const admin = await adminService.findManyByPagination(
            {
                column: column[0] as keyof AdminDto,
                value: `%${query[column[0]]}%`,
                operator: "like",
            },
            {
                page: query.page,
                sort: query.sort,
                order: query.order,
                limit: query.limit,
            },
            {
                column: "role",
                value: config.roleAdmin,
            },
        );

        return res.send({
            data: admin.rows,
            page: query.page,
            total: admin.count,
            totalPage: Math.ceil(admin.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const admin = await adminService.findAllPagination(
        {
            page: query.page,
            sort: query.sort,
            order: query.order,
            limit: query.limit,
        },
        {
            column: "role",
            value: config.roleAdmin,
        },
    );

    return res.send({
        data: admin.data,
        page: query.page,
        total: admin.total,
        totalPage: Math.ceil(admin.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllAdminPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
