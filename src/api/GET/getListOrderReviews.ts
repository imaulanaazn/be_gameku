import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { Op, col, fn } from "sequelize";
import { censorPhoneNumber } from "@helper/censorPhoneNumber";
import { GameService } from "@serviceInternal/game.service";
import { BusinessError } from "@helper/handleError";

const path = "/v1/order-review";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "gameId",
        required: false,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        gameId?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    let where: {} = {};
    if (query.gameId) {
        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: query.gameId,
        });

        if (!game) {
            throw new BusinessError("Game tidak ditemukan", ErrorType.BadRequest);
        }
        where = {
            gameName: {
                [Op.like]: `%${game.name}%`,
            },
        };
    }

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.model.findAndCountAll({
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        attributes: ["message", "rating", "mobileNumber", ["product_name", "product"], "createdAt"],
        where,
    });

    const newData = orderReview.rows.map((review) => {
        return {
            ...review.dataValues,
            mobileNumber: censorPhoneNumber(review.mobileNumber),
        };
    });

    const groupingRating: { rating: string; totalRating: number }[] = (await orderReviewService.model.findAll({
        attributes: ["rating", [fn("COUNT", col("rating")), "totalRating"]],
        group: ["rating"],
        where,
    })) as any;

    const allRatings = ["1.0", "2.0", "3.0", "4.0", "5.0"];
    const mergedRatings = allRatings
        .map((rating) => {
            const foundRating = groupingRating.find((item) => item.rating === rating);
            return foundRating ? foundRating : { rating, totalRating: 0 };
        })
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    const averageRating = await orderReviewService.model.aggregate("rating", "avg", {
        where,
    });

    res.send({
        reviews: newData,
        ratings: mergedRatings,
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
