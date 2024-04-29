import { OrderEntity } from "@entity/order.entity";
import { ErrorType, OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { GameService } from "@serviceInternal/game.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderService } from "@serviceInternal/order.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { Op, fn, col, literal, and } from "sequelize";

const path = "/v1/order-analytics";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "type",
        required: false,
        type: "string",
        enum: ["count", "latestOrder", "popularGame", "countOrder"],
    },
    {
        name: "start",
        required: false,
        type: "string",
    },
    {
        name: "end",
        required: false,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        type: "count" | "latestOrder" | "popularGame" | "countOrder";
        start: string;
        end: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const orderService = new OrderService();

    if (query.type === "countOrder" && (!query.end || !query.start)) {
        throw new BusinessError("Query tidak valid", ErrorType.BadRequest);
    }

    if (query.type === "countOrder") {
        const orders = await orderService.model.findOne({
            attributes: [
                [fn("SUM", col("total_amt")), "reveneu"],
                [fn("SUM", col("fee_amt")), "fee"],
            ],
            where: {
                createdAt: {
                    [Op.and]: [{ [Op.gte]: dayjs(query.start).toDate() }, { [Op.lte]: dayjs(query.end).toDate() }],
                },
                status: OrderStatuses.SUCCESS,
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
        });

        return res.send(orders);
    } else if (query.type === "count") {
        const endDate = dayjs().toDate();
        const _30daysAgo = dayjs().subtract(30, "day").toDate();
        const _60daysAgo = dayjs().subtract(60, "day").toDate();
        const orders = await orderService.find<
            {
                dataValues: {
                    date: string;
                    totalOrders: number;
                    pending: string;
                    paid: string;
                    expired: string;
                    failed: string;
                };
            }[]
        >({
            attributes: [
                [fn("DATE", literal("CONVERT_TZ(created_at, '+00:00', '+07:00')")), "date"],
                [fn("COUNT", col("*")), "totalOrders"],
                [fn("SUM", literal(`CASE WHEN status IN ('1', '2') THEN 1 ELSE 0 END`)), "pending"],
                [fn("SUM", literal(`CASE WHEN status = '3' THEN 1 ELSE 0 END`)), "paid"],
                [fn("SUM", literal(`CASE WHEN status = '5' THEN 1 ELSE 0 END`)), "expired"],
                [fn("SUM", literal(`CASE WHEN status = '4' THEN 1 ELSE 0 END`)), "failed"],
            ],
            where: {
                createdAt: {
                    [Op.between]: [_30daysAgo, endDate],
                },
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
            group: [fn("DATE", literal("CONVERT_TZ(created_at, '+00:00', '+07:00')"))],
            order: [fn("DATE", literal("CONVERT_TZ(created_at, '+00:00', '+07:00')"))],
        });

        const customerService = new CustomerService();
        const customers = await customerService.find<{ dataValues: { totalCustomers: number; date: string } }[]>({
            attributes: [
                [fn("DATE", col("created_at")), "date"],
                [fn("COUNT", col("*")), "totalCustomers"],
            ],
            where: {
                createdAt: {
                    [Op.between]: [_30daysAgo, endDate],
                },
                isRegistered: true,
            },
            group: [fn("DATE", col("created_at"))],
            order: [fn("DATE", col("created_at"))],
        });

        const dateArray: string[] = [];
        for (let i = 0; i <= 30; i++) {
            dateArray.push(dayjs(_30daysAgo).add(i, "day").format("YYYY-MM-DD"));
        }

        const filledData = dateArray.map((date) => {
            const foundData = orders.find((item) => item.dataValues.date === date);
            const customerData = customers.find((item) => item.dataValues.date === date);
            let totalCustomers = 0;
            if (customerData) {
                totalCustomers = customerData.dataValues.totalCustomers;
            }
            return foundData
                ? {
                      ...foundData.dataValues,
                      pending: parseInt(foundData.dataValues.pending),
                      paid: parseInt(foundData.dataValues.paid),
                      expired: parseInt(foundData.dataValues.expired),
                      failed: parseInt(foundData.dataValues.failed),
                      totalCustomers,
                  }
                : { date, totalOrders: 0, pending: 0, paid: 0, expired: 0, failed: 0, totalCustomers };
        });

        const totalOrders30daysAgo = await orderService.find<
            {
                dataValues: {
                    totalOrders30daysAgo: number;
                };
            }[]
        >({
            attributes: [[fn("COUNT", col("*")), "totalOrders30daysAgo"]],
            where: {
                createdAt: {
                    [Op.between]: [_30daysAgo, endDate],
                },
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
        });

        const totalOrders60daysAgo = await orderService.find<
            {
                dataValues: {
                    totalOrders60daysAgo: number;
                };
            }[]
        >({
            attributes: [[fn("COUNT", col("*")), "totalOrders60daysAgo"]],
            where: {
                createdAt: {
                    [Op.between]: [_60daysAgo, _30daysAgo],
                },
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
        });

        return res.send({
            totalOrders30daysAgo: totalOrders30daysAgo[0].dataValues.totalOrders30daysAgo,
            totalOrders60daysAgo: totalOrders60daysAgo[0].dataValues.totalOrders60daysAgo,
            data: filledData,
        });
    } else if (query.type === "latestOrder") {
        const orders = await orderService.find<OrderEntity[]>({
            where: {
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
            offset: 0,
            limit: 5,
            order: [["createdAt", "DESC"]],
        });

        const ordersId = orders.map((item) => item.id);
        const orderDetailService = new OrderDetailService();
        const ordersDetail = await orderDetailService.findManyBy({
            column: "orderId",
            value: ordersId,
            operator: "in",
        });

        const productId = ordersDetail.map((data) => data.productId);
        const productService = new ProductService();
        const products = await productService.findManyBy({
            column: "id",
            value: productId,
            operator: "in",
            only: ["id", "gameId"],
        });

        const gameId = products.map((data) => data.gameId);
        const gamesService = new GameService();
        const games = await gamesService.findManyBy({
            column: "id",
            value: gameId,
            operator: "in",
            only: ["id", "logoUrl"],
        });

        const customerId = orders.map((item) => item.customerId);
        const customerService = new CustomerService();
        const customers = await customerService.findManyBy({
            column: "id",
            value: customerId,
            operator: "in",
        });

        const invoiceService = new InvoiceService();
        const invoices = await invoiceService.findManyBy({
            column: "id",
            value: orders.map((item) => item.invoiceId),
            operator: "in",
        });
        const orderData = orders.map((data) => {
            const orderDetail = ordersDetail.find((item) => item.orderId === data.id);
            const product = products.find((data) => data.id === orderDetail.productId);
            const game = games.find((data) => data.id === product.gameId);
            const customer = customers.find((item) => item.id === data.customerId);
            const invoice = invoices.find((inv) => inv.id === data.invoiceId);
            let status = data.status;

            if (status === OrderStatuses.PENDING_PAYMENT && dayjs().isAfter(dayjs(invoice.expiredAt))) {
                status = OrderStatuses.EXPIRED;
            }

            return {
                ...data.dataValues,
                productId: orderDetail.productId,
                amount: orderDetail.amount,
                quantity: orderDetail.quantity,
                logoUrl: game.logoUrl,
                mobileNumber: customer.mobileNumber,
                status,
            };
        });
        return res.send(orderData);
    } else if (query.type === "popularGame") {
        const dateNow = dayjs().toDate();
        const _30daysAgo = dayjs().subtract(30, "day").toDate();
        const orders = await orderService.find<OrderEntity[]>({
            where: {
                createdAt: {
                    [Op.between]: [_30daysAgo, dateNow],
                },
                type: { [Op.in]: [OrderType.TOPUP, null] },
            },
            attributes: ["game"],
        });

        const gameGroups = orders.reduce((groups, entry) => {
            const gameName = entry.game;

            const index = groups.findIndex((group) => group.name === gameName);

            if (index === -1) {
                groups.push({ name: gameName, value: 1 });
            } else {
                groups[index].value++;
            }

            return groups;
        }, []);

        return res.send(gameGroups);
    } else {
        throw new BusinessError("Request tidak valid", ErrorType.BadRequest);
    }
};

export const getOrderAnalytics: IApiRouter = {
    main,
    path,
    method,
    auth,
};
