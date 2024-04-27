import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { Op, col, fn } from "sequelize";
import { OrderService } from "@serviceInternal/order.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { censorPhoneNumber } from "@helper/censorPhoneNumber";
import { GameService } from "@serviceInternal/game.service";
import { BusinessError } from "@helper/handleError";
import { OrderEntity } from "@entity/order.entity";
import { CustomerEntity } from "@entity/customer.entity";

const path = "/v1/order-review";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "gameId",
        required: true,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        gameId: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: query.gameId,
    });

    if (!game) {
        throw new BusinessError("Game tidak ditemukan", ErrorType.BadRequest);
    }

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.model.findAndCountAll({
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        include: [
            {
                model: OrderEntity,
                as: "order",
                required: true,
                where: {
                    game: {
                        [Op.like]: game.name,
                    },
                },
                include: [
                    {
                        model: CustomerEntity,
                        as: "customer",
                        required: true,
                    },
                ],
            },
        ],
    });

    const newData = orderReview.rows.map((review) => {
        return {
            message: review.message,
            rating: review.rating,
            mobileNumber: censorPhoneNumber(review.mobileNumber),
            product: review?.order?.productName || "",
            createdAt: review.createdAt,
            // game: review?.order?.game,
        };
    });

    const groupingRating: { rating: string; totalRating: number }[] = (await orderReviewService.model.findAll({
        attributes: ["rating", [fn("COUNT", col("rating")), "totalRating"]],
        group: ["rating"],
        include: [
            {
                model: OrderEntity,
                as: "order",
                required: true,
                attributes: [],
                where: {
                    "$order.game$": {
                        [Op.like]: `%${game.name}%`,
                    },
                },
            },
        ],
        // where: {
        //     "$order.game$": {
        //         [Op.like]: `%${game.name}%`,
        //     },
        // },
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
