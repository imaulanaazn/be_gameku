import { Config } from "@config/index";
import { OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { FundService } from "@serviceInternal/fund.service";
import { OrderService, PaymentMethodService } from "@serviceInternal/index";
import { RequestHandler } from "express";
import { Op, col, fn } from "sequelize";

const path = "/v1/user";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "keyword",
        type: "string",
        required: false,
    },
    {
        name: "type",
        type: "string",
        required: false,
        enum: ["reseller", "user"],
        default: "user",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        keyword?: string;
        type: "reseller" | "user";
    }>(schemaValidation, ValidatorType.QUERY, true);

    const customerService = new CustomerService();
    let where = [];
    const searchBy = ["email", "mobileNumber", "name"];
    if (query.keyword) {
        for (const key of searchBy) {
            where.push({ [key]: { [Op.like]: `%${query.keyword}%` } });
        }
    }

    const config = new Config();
    const users = await customerService.model.findAndCountAll({
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        where: {
            ...(where.length > 0 ? { [Op.or]: where } : {}),
            isRegistered: true,
            roleId: [query.type === "reseller" ? config.roleReseller : config.roleUser],
        },
    });

    if (query.type === "reseller") {
        const paymentMethodService = new PaymentMethodService();

        const payment = await paymentMethodService.findOneBy({
            column: "cd",
            value: "GASSKEUN",
        });

        const customerIds = users.rows.map((item) => item.id);

        const fundService = new FundService();
        const funds = await fundService.model.findAll({
            where: {
                customerId: {
                    [Op.in]: customerIds,
                },
            },
        });

        const orderService = new OrderService();
        const orders = await orderService.model.findAll({
            where: {
                type: [OrderType.TOPUP, null],
                status: [OrderStatuses.PENDING_ORDER, OrderStatuses.PROCESSING, OrderStatuses.SUCCESS],
                customerId: {
                    [Op.in]: customerIds,
                },
                paymentMethodId: payment.id,
            },
            attributes: [
                ["customer_id", "customerId"],
                [fn("SUM", col("total_amt")), "totalAmt"],
            ],
            group: ["customerId"],
        });

        const newData = users.rows.map((user) => {
            const fund = funds.find((item) => item.customerId === user.id);
            const order = orders.find((item) => item.customerId === user.id);

            return {
                ...user.dataValues,
                balance: fund.value - (order?.totalAmt ? order.totalAmt : 0),
            };
        });

        return res.send({
            data: newData,
            page: query.page,
            total: users.count,
            totalPage: Math.ceil(users.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    return res.send({
        data: users.rows,
        page: query.page,
        total: users.count,
        totalPage: Math.ceil(users.count / query.limit),
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
