import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { Op, col, fn } from "sequelize";
import { OrderService } from "@serviceInternal/order.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { censorPhoneNumber } from "@helper/censorPhoneNumber";

const path = "/v1/order-review";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{}>(schemaValidation, ValidatorType.QUERY, true);

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.model.findAndCountAll({
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
    });

    const orderIds = orderReview.rows.map((item) => item.orderId);
    const orderService = new OrderService();
    const orders = await orderService.model.findAll({
        where: {
            id: {
                [Op.in]: orderIds,
            },
        },
    });

    const customerIds = orders.map((item) => item.customerId);
    const customerService = new CustomerService();
    const customers = await customerService.model.findAll({
        where: {
            id: {
                [Op.in]: customerIds,
            },
        },
    });

    const newData = orderReview.rows.map((review) => {
        const order = orders.find((item) => item.id === review.orderId);
        const customer = customers.find((item) => item.id === order.customerId);

        return {
            message: review.message,
            rating: review.rating,
            mobileNumber: censorPhoneNumber(customer.mobileNumber),
            product: order.productName,
            createdAt: review.createdAt,
        };
    });

    const groupingRating: { rating: string; totalRating: number }[] = (await orderReviewService.model.findAll({
        attributes: ["rating", [fn("COUNT", col("rating")), "totalRating"]],
        group: ["rating"],
    })) as any;

    const averageRating = await orderReviewService.model.aggregate("rating", "avg");

    res.send({
        reviews: newData,
        ratings: groupingRating,
        averageRating,
        totalRating: orderReview.count,
    });
};

export const getListOrderReviews: IApiRouter = {
    path,
    method,
    main,
    auth,
};
