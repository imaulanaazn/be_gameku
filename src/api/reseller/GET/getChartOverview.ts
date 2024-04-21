import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { OrderType, OrderStatuses, ValidatorType, ErrorType, TypeOverview } from "@enum/index";
import { Op, col, fn, literal } from "sequelize";
import { OrderService } from "@serviceInternal/order.service";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { ProductEntity } from "@entity/product.entity";
import { Validator } from "@helper/validator";
import { BusinessError } from "@helper/handleError";
// import isoWeek from "dayjs/plugin/weekday";
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);

const path = "/v1/reseller/chart-overview";
const method = "GET";
const auth = "reseller";

const schemaValidation: Validation[] = [
    {
        name: "startAt",
        type: "string",
        required: false,
        default: dayjs().add(-30, "day").toISOString(),
    },
    {
        name: "endAt",
        type: "string",
        required: false,
        default: dayjs().toISOString(),
    },
    {
        name: "type",
        type: "string",
        required: false,
        enum: ["DAY", "MONTH", "YEAR"],
        default: "DAY",
    },
];

const main: RequestHandler = async (req, res) => {
    const session = req.reseller.data;
    const query = new Validator(req, res).process<{
        startAt: string;
        endAt: string;
        type: "DAY" | "MONTH" | "YEAR";
    }>(schemaValidation, ValidatorType.QUERY);

    const orderService = new OrderService();
    const startAt = dayjs(query.startAt);
    const endAt = dayjs(query.endAt);

    let attributes: any;
    switch (query.type) {
        case "DAY":
            attributes = [fn("DATE", col("created_at")), "date"];
            break;
        case "MONTH":
            attributes = [literal("DATE_FORMAT(created_at, '%Y-%m')"), "date"];
            break;
        case "YEAR":
            attributes = [literal("DATE_FORMAT(created_at, '%Y')"), "date"];
            break;
        default:
            attributes = [fn("DATE", col("created_at")), "date"];
            break;
    }

    const orders = await orderService.model.findAll({
        where: {
            customerId: session.id,
            [Op.or]: [{ type: OrderType.TOPUP }, { type: null }],
            status: OrderStatuses.SUCCESS,
            createdAt: {
                [Op.between]: [startAt.toDate(), endAt.toDate()],
            },
        },
        attributes: [[fn("SUM", col("total_amt")), "amount"], attributes],
        order: [[literal("date"), "ASC"]],
        group: "date",
    });

    const startDate = dayjs(query.startAt);
    const endDate = dayjs(query.endAt);

    const ordersByDate: any = {};

    let format = "YYYY";
    if (query.type === "MONTH" || query.type === "DAY") {
        format += `-MM${query.type === "DAY" ? "-DD" : ""}`;
    }
    let currentDate = startDate;
    let groups = [];
    while (currentDate.isSameOrBefore(endDate, query.type.toLowerCase() as any)) {
        ordersByDate[currentDate.format(format)] = { y: 0, x: currentDate.format(format) };
        currentDate = currentDate.add(1, query.type.toLowerCase() as any);

        const getTitle = currentDate.format(`YYYY${query.type === "DAY" ? "-MM" : ""}`);
        const group = groups.find((item) => item.title === getTitle);
        if (group) {
            group.cols += 1;
        } else {
            groups.push({
                title: getTitle,
                cols: 1,
            });
        }
    }

    for (const order of orders as any) {
        const orderDate = dayjs(order.dataValues.date);
        const formattedDate = orderDate.format(format);
        if (formattedDate in ordersByDate) {
            order.dataValues.amount = parseInt(order.dataValues.amount);
            ordersByDate[formattedDate] = {
                y: order.dataValues.amount,
                x: formattedDate,
            };
        }
    }

    const filledOrders = Object.values(ordersByDate);
    return res.send({
        grouped: query.type !== "YEAR",
        series: filledOrders,
        groups: query.type !== "YEAR" && groups,
    });
};

export const getChartOverview: IApiRouter = {
    path,
    method,
    main,
    auth,
};
