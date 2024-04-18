import { OrderStatuses, OrderType, ValidatorType } from "@enum/index";
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
import { Op } from "sequelize";

const path = "/v1/reseller/orders";
const method = "GET";
const auth = "reseller";

const schemaValidation: Validation[] = [
    {
        name: "status",
        required: false,
        type: "string",
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
    {
        name: "invoiceId",
        required: false,
        type: "string",
    },
    {
        name: "type",
        required: true,
        type: "string",
        enum: ["order", "fund"],
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        status?: OrderStatuses;
        start?: string;
        end?: string;
        invoiceId: string;
        type: "order" | "fund";
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.start;
    delete clearQuery.end;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;
    delete clearQuery.type;

    const orderService = new OrderService();
    const customer = req.reseller.data;
    const column = Object.keys(query);

    let where;
    if (column.length > 4) {
        let whereQuery = {
            ...clearQuery,
            ...(query.start &&
                query.end && {
                    createdAt: {
                        [Op.and]: [{ [Op.gte]: dayjs(query.start).toDate() }, { [Op.lte]: dayjs(query.end).toDate() }],
                    },
                }),
        };
        where = whereQuery;
    }

    let order: any = [[query.sort, query.order]];

    const orderType =
        query.type === "order" ? { [Op.or]: [{ type: null }, { type: OrderType.TOPUP }] } : { type: [OrderType.BUY] };
    const data = await orderService.model.findAndCountAll({
        where: {
            ...(where && where),
            customerId: customer.id,
            ...orderType,
        },
        order,
        offset: (query.page - 1) * query.limit,
        limit: query.limit,
    });

    if (data.count === 0) {
        return res.send({
            data: [],
            page: query.page,
            total: 0,
            totalPage: Math.ceil(0 / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
            analytics: {
                reveneu: 0,
                fee: 0,
                discount: 0,
                orders: data.count,
                countPaid: 0,
                countUnpaid: 0,
            },
        });
    }
    const orderId = data.rows.map((data) => data.id);
    const orderDetailService = new OrderDetailService();
    const orderDetail = await orderDetailService.findManyBy({
        column: "orderId",
        value: orderId,
        operator: "in",
    });

    const productService = new ProductService();
    const products = await productService.findManyBy({
        column: "id",
        value: orderDetail.map((item) => item.productId),
        operator: "in",
        only: ["id", "gameId"],
    });

    const gameService = new GameService();
    const games = await gameService.findManyBy({
        column: "id",
        value: products.map((item) => item.gameId),
        operator: "in",
    });

    const invoiceService = new InvoiceService();
    const invoices = await invoiceService.findManyBy({
        column: "id",
        value: data.rows.map((item) => item.invoiceId),
        operator: "in",
    });

    const newData = data.rows.map((item) => {
        const detail = orderDetail.find((detail) => item.id === detail.orderId);
        const product = products.find((prod) => prod.id === detail.productId);
        const game = games.find((game) => game.id === product.gameId);
        const invoice = invoices.find((inv) => inv.id === item.invoiceId);
        let status = item.status;

        if (status === OrderStatuses.PENDING_PAYMENT && dayjs().isAfter(dayjs(invoice.expiredAt))) {
            status = OrderStatuses.EXPIRED;
        }
        return {
            ...item.dataValues,
            productId: detail?.productId,
            logoUrl: game?.logoUrl,
            quantity: detail?.quantity,
            username: detail?.username,
            status,
            detail,
        };
    });

    return res.send({
        data: newData,
        page: query.page,
        total: data.count,
        totalPage: Math.ceil(data.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllOrdersPaginationReseller: IApiRouter = {
    main,
    path,
    method,
    auth,
};
