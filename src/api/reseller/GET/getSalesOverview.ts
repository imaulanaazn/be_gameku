import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { OrderService } from "@serviceInternal/order.service";
import { OrderType, OrderStatuses, ValidatorType } from "@enum/index";
import { Op } from "sequelize";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { ProductService } from "@serviceInternal/product.service";
import dayjs from "dayjs";
import { GameEntity } from "@entity/game.entity";
import { Validator } from "@helper/validator";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";

const path = "/v1/reseller/sales-overview";
const method = "GET";
const auth = "reseller";

const schemaValidation: Validation[] = [
    {
        name: "startAt",
        type: "string",
        required: false,
        default: dayjs().startOf("month").toISOString(),
    },
    {
        name: "endAt",
        type: "string",
        required: false,
        default: dayjs().endOf("month").toISOString(),
    },
];

const main: RequestHandler = async (req, res) => {
    const session = req.reseller.data;
    const query = new Validator(req, res).process<{
        startAt: string;
        endAt: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const orderService = new OrderService();
    const startOfMonth = dayjs(query.startAt);
    const endOfMonth = dayjs(query.endAt);
    const data = await orderService.model.findAll({
        where: {
            customerId: session.id,
            [Op.or]: [{ type: OrderType.TOPUP }, { type: null }],
            status: OrderStatuses.SUCCESS,
            createdAt: {
                [Op.gte]: startOfMonth.toDate(),
                [Op.lte]: endOfMonth.toDate(),
            },
        },
        attributes: ["totalAmt", "id"],
    });

    const orderDetailService = new OrderDetailService();
    const orderDetails = await orderDetailService.model.findAll({
        where: {
            orderId: data.map((item) => item.id),
        },
    });

    const orders = data.map((order) => {
        const orderDetail = orderDetails.find((od) => od.orderId === order.id);
        return {
            ...order.dataValues,
            orderDetail,
        };
    });

    let groupingData: Array<{ productId: string; totalAmt: number }> = [];
    let totalSales = 0;
    for (const order of orders) {
        const check = groupingData.find((item) => item.productId === order.orderDetail.productId);
        if (check) {
            check.totalAmt += order.totalAmt;
        } else {
            groupingData.push({
                productId: order.orderDetail.productId,
                totalAmt: order.totalAmt,
            });
        }

        totalSales += order.totalAmt;
    }

    const sortingData = groupingData.sort((a, b) => b.totalAmt - a.totalAmt)?.slice(0, 3);

    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            id: sortingData?.map((item) => item.productId),
        },
        attributes: ["id", "name", "gameId"],
        include: {
            model: GameEntity,
            as: "game",
            required: true,
        },
    });

    const newData = sortingData.map((item) => {
        const product = products.find((prod) => prod.id === item.productId);
        const percentage = (item.totalAmt / totalSales) * 100;
        return {
            ...item,
            productName: product?.name,
            gameName: product?.game?.name,
            gameLogo: product?.game?.logoUrl,
            percentage,
        };
    });

    return res.send({
        totalSales,
        startAt: query.startAt,
        endAt: query.endAt,
        data: newData,
    });
};

export const getSalesOverview: IApiRouter = {
    path,
    method,
    main,
    auth,
};
