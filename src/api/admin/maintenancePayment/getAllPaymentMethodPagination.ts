import { PaymentMethodDto } from "@dto/paymentMethod.dto";
import { PaymentMethodEntity } from "@entity/paymentMethod.entity";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { RequestHandler } from "express";

const path = "/v1/payment-method";
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

    const paymentMethodService = new PaymentMethodService();
    const column = Object.keys(query);

    let paymentsMethod: {
        data: PaymentMethodEntity[];
        total: number;
    };
    if (column.length > 4) {
        const data = await paymentMethodService.findManyByPagination(
            {
                column: column[0] as keyof PaymentMethodDto,
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

        paymentsMethod = {
            data: data.rows,
            total: data.count,
        };
    } else {
        const data = await paymentMethodService.findAllPagination({
            page: query.page,
            sort: query.sort,
            order: query.order,
            limit: query.limit,
        });

        paymentsMethod = data;
    }

    return res.send({
        data: paymentsMethod.data,
        page: query.page,
        total: paymentsMethod.total,
        totalPage: Math.ceil(paymentsMethod.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllPaymentMethodPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
