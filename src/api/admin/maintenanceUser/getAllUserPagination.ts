import { CustomerDto } from "@dto/customer.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";

const path = "/v1/user";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "email",
        type: "string",
    },
    {
        name: "mobileNumber",
        type: "string",
    },
    {
        name: "name",
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        email?: string;
        mobileNumber?: string;
        name?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const customerService = new CustomerService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const user = await customerService.findManyByPagination(
            {
                column: column[0] as keyof CustomerDto,
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
                column: "isRegistered",
                value: true,
            },
        );

        return res.send({
            data: user.rows,
            page: query.page,
            total: user.count,
            totalPage: Math.ceil(user.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const user = await customerService.findAllPagination(
        {
            page: query.page,
            sort: query.sort,
            order: query.order,
            limit: query.limit,
        },
        {
            column: "isRegistered",
            value: true,
        },
    );

    return res.send({
        data: user.data,
        page: query.page,
        total: user.total,
        totalPage: Math.ceil(user.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllUserPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
