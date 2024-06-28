import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { OrderReviewService } from "@serviceInternal/orderReview.service";

const path = "/v1/order-review/:reviewId";
const method = APIMethod.PUT;
const auth = APIAuth.GUEST;

const schemaValidationParams: Validation[] = [
    {
        name: "reviewId",
        type: "string",
        required: true,
    },
];
const schemaValidation: Validation[] = [
    {
        name: "message",
        type: "string",
        required: true,
    },
    {
        name: "rating",
        type: "number",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const params = new Validator(req, res).process<{
        reviewId: string;
    }>(schemaValidationParams, ValidatorType.PARAMS);

    const body = new Validator(req, res).process<{
        message: string;
        rating: number;
    }>(schemaValidation, ValidatorType.BODY);

    if (body.rating > 5) {
        body.rating = 5;
    }

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.findOneBy({
        column: "id",
        value: params.reviewId,
    });

    if (!orderReview) {
        throw new BusinessError(`Ulasan tidak ditemukan dengan id ${params.reviewId}`, ErrorType.BadRequest);
    }

    if (orderReview.hasUpdated) {
        throw new BusinessError(`Ulasan telah memenuhi maksimal untuk diperbarui`, ErrorType.BadRequest);
    }

    await orderReviewService.updateBy({
        by: "id",
        value: params.reviewId,
        data: {
            message: body.message,
            rating: body.rating,
            hasUpdated: true,
        },
    });

    res.sendStatus(200);
    return;
};

export const putChangeOrderReview: IApiRouter = {
    path,
    method,
    main,
    auth,
};
