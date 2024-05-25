import { PaymentMethodDto } from "@dto/paymentMethod.dto";
import { PaymentMethodEntity } from "@entity/paymentMethod.entity";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/payment-method";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: false,
    },
    {
        name: "is_active",
        type: "string",
        required: false,
        enum: ["true", "false"],
    },
    {
        name: "category",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
        is_active?: "true" | "false";
        category?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.is_active;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const paymentMethodService = new PaymentMethodService();
    const column = Object.keys(query);

    let where: any = {};
    if (column.length > 4) {
        if (query.is_active) {
            where.is_active = query.is_active === "true";
        }

        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const datas = await paymentMethodService.model.findAndCountAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        order: [[query.sort, query.order]],
        where: {
            deleted: false,
            ...where,
        },
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

    // let paymentsMethod: {
    //     data: PaymentMethodEntity[];
    //     total: number;
    // };
    // if (column.length > 4) {
    //     const data = await paymentMethodService.findManyByPagination(
    //         {
    //             column: column[0] as keyof PaymentMethodDto,
    //             value: `%${query[column[0]]}%`,
    //             operator: "like",
    //         },
    //         {
    //             page: query.page,
    //             sort: query.sort,
    //             order: query.order,
    //             limit: query.limit,
    //         },
    //     );

    //     paymentsMethod = {
    //         data: data.rows,
    //         total: data.count,
    //     };
    // } else {
    //     const data = await paymentMethodService.findAllPagination({
    //         page: query.page,
    //         sort: query.sort,
    //         order: query.order,
    //         limit: query.limit,
    //     });

    //     paymentsMethod = data;
    // }

    // return res.send({
    //     data: paymentsMethod.data,
    //     page: query.page,
    //     total: paymentsMethod.total,
    //     totalPage: Math.ceil(paymentsMethod.total / query.limit),
    //     order: query.order,
    //     sort: query.sort,
    //     limit: query.limit,
    // });
};

export const getAllPaymentMethodPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
