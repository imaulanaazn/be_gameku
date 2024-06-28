import { Config } from "@config/index";
import { OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { OrderService } from "@serviceInternal/order.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { Op } from "sequelize";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/order-revenue";
const method = APIMethod.GET;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "startAt",
        required: false,
        type: "string",
        default: dayjs().subtract(1, "year").startOf("day").toISOString(),
    },
    {
        name: "endAt",
        required: false,
        type: "string",
        default: dayjs().endOf("day").toISOString(),
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        type: "count" | "latestOrder" | "popularGame" | "countOrder";
        startAt: string;
        endAt: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const orderService = new OrderService();
    const config = new Config();

    const startAt = dayjs(query.startAt).startOf("day");
    const endAt = dayjs(query.endAt).endOf("day");

    const queryTotalAmt = orderService.model.sum("totalAmt", {
        where: {
            createdAt: {
                [Op.between]: [startAt.toDate(), endAt.toDate()],
            },
            status: OrderStatuses.SUCCESS,
            type: { [Op.in]: [OrderType.TOPUP, null] },
        },
    });
    const queryTotalFee = orderService.model.sum("feeAmt", {
        where: {
            createdAt: {
                [Op.between]: [startAt.toDate(), endAt.toDate()],
            },
            status: OrderStatuses.SUCCESS,
            type: { [Op.in]: [OrderType.TOPUP, null] },
        },
    });

    const queryTrxSuccess = orderService.model.count({
        where: {
            createdAt: {
                [Op.between]: [startAt.toDate(), endAt.toDate()],
            },
            status: OrderStatuses.SUCCESS,
            type: { [Op.in]: [OrderType.TOPUP, null] },
        },
    });

    const [totalOrders, totalAmt, totalFee, totalTrxSuccess] = await Promise.all([
        orderService.countOrders({
            startAt: dayjs(query.startAt).toDate(),
            endAt: dayjs(query.endAt).toDate(),
        }),
        queryTotalAmt,
        queryTotalFee,
        queryTrxSuccess,
    ]);

    res.send({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        data: {
            totalOrders,
            revenue: Math.floor(totalAmt - totalFee),
            totalTrxSuccess,
        },
    });
};

export const getRevenue: IApiRouter = {
    main,
    path,
    method,
    auth,
};
