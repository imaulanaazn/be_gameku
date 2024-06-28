import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { OrderService } from "@serviceInternal/order.service";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { v4 as uuid } from "uuid";
import { CustomerService } from "@serviceInternal/customer.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { GameService } from "@serviceInternal/game.service";
import { Op } from "sequelize";
import dayjs from "dayjs";
import { OrderReviewEntity } from "@entity/orderReview.entity";
import { OrderEntity } from "@entity/order.entity";
import { createLogCronjobInternal } from "@helper/logger";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/cron-set-order-review";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const logging = createLogCronjobInternal();
    const listOfReviews = [
        "Pilihan denomnya banyak",
        "Harganya Murah Banget",
        "Prosesnya Cepat Banget",
        "Pelayanannya terbaik",
    ];

    const dateNow = dayjs();
    const dateTime = dateNow.subtract(1, "hour");
    const batchSize = 100;
    let totalCount = 0;
    let totalBatch = 0;

    const orderService = new OrderService();
    const orderReviewService = new OrderReviewService();
    const orderDetailService = new OrderDetailService();
    const customerService = new CustomerService();
    const gameService = new GameService();
    const productService = new ProductService();

    do {
        const dataBatchOrder = await orderService.model.findAndCountAll({
            where: {
                type: {
                    [Op.in]: [OrderType.TOPUP, null],
                },
                status: OrderStatuses.SUCCESS,
                completedAt: {
                    [Op.lte]: dateTime.toISOString(),
                },
                "$orderReview.order_id$": null,
            },
            include: [
                {
                    model: OrderReviewEntity,
                    as: "orderReview",
                    required: false,
                },
            ],
            limit: batchSize,
        });

        logging.log(`Total Data ${dataBatchOrder.count}`);
        logging.log(`Fetched ${dataBatchOrder.rows.length} records`);
        const orderIds = dataBatchOrder.rows.map((item) => item.id);
        const orderDetails = await orderDetailService.model.findAll({
            where: {
                orderId: {
                    [Op.in]: orderIds,
                },
            },
            attributes: ["id", "orderId", "productId"],
        });

        const customerIds = dataBatchOrder.rows.map((item) => item.customerId);
        const customers = await customerService.model.findAll({
            where: {
                id: {
                    [Op.in]: customerIds,
                },
            },
            attributes: ["id", "name", "mobileNumber"],
        });

        const productIds = orderDetails.map((item) => item.productId);
        const products = await productService.model.findAll({
            where: {
                id: {
                    [Op.in]: productIds,
                },
            },
            attributes: ["id", "gameId", "name"],
        });

        const gameIds = products.map((item) => item.gameId);
        const games = await gameService.model.findAll({
            where: {
                id: {
                    [Op.in]: gameIds,
                },
            },
        });

        const dataBatchOrderReview = dataBatchOrder.rows.map((item) => {
            const randomIndex = Math.floor(Math.random() * 4);
            const customer = customers.find((customer) => customer.id === item.customerId);
            const orderDetail = orderDetails.find((orderDetail) => orderDetail.orderId === item.id);
            const product = products.find((product) => product.id === orderDetail?.productId);
            const game = games.find((game) => game.id === product?.gameId);
            const data = {
                id: uuid(),
                orderId: item.id,
                gameId: game?.id || "",
                productId: product?.id || "",
                gameName: game?.name || "",
                productName: product?.name || "",
                mobileNumber: customer?.mobileNumber || "",
                message: listOfReviews[randomIndex],
                rating: 5,
                hasUpdated: false,
                createdAt: dayjs().toDate(),
            };
            return data;
        });
        logging.log(dataBatchOrderReview);

        await orderReviewService.model.bulkCreate(dataBatchOrderReview);
        totalBatch += batchSize;

        if (totalCount === 0) {
            totalCount = dataBatchOrder.count;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (totalBatch < totalCount);

    logging.log(`Total records fetched: ${totalCount}`);

    return res.sendStatus(200);
};

export const cronSetOrderReview: IApiRouter = {
    path,
    method,
    main,
    auth,
};
