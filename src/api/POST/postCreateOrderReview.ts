import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, OrderStatuses, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { OrderService } from "@serviceInternal/order.service";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { v4 as uuid } from "uuid";
import { CustomerService } from "@serviceInternal/customer.service";

const path = "/v1/order-review";
const method = "POST";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "orderId",
        type: "string",
        required: true,
    },
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
    const ip = req.ip;
    const body = new Validator(req, res).process<{
        orderId: string;
        message: string;
        rating: number;
    }>(schemaValidation, ValidatorType.BODY);

    const orderService = new OrderService();
    const order = await orderService.findOneBy({
        column: "id",
        value: body.orderId,
    });

    if (!order) {
        throw new BusinessError(`Transaksi tidak valid dengan ID ${body.orderId}`, ErrorType.BadRequest);
    }

    if (order.status !== OrderStatuses.SUCCESS) {
        throw new BusinessError(
            `Tidak bisa memberikan ulasan untuk transaksi ini, karena transaksi tidak/belum sukses`,
            ErrorType.BadRequest,
        );
    }

    const customerService = new CustomerService();
    const customer = await customerService.findOneBy({
        column: "id",
        value: order.customerId,
    });

    if (body.rating > 5) {
        body.rating = 5;
    }

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.findOneBy({
        column: "orderId",
        value: order.id,
    });

    if (orderReview) {
        throw new BusinessError(`Kamu sudah pernah memberikan ulasan untuk transaksi ini`, ErrorType.BadRequest);
    }

    await orderReviewService.create({
        id: uuid(),
        orderId: order.id,
        message: body.message,
        rating: body.rating,
        mobileNumber: customer.mobileNumber || "",
    });

    res.sendStatus(200);
    return;
};

export const postCreateOrderReview: IApiRouter = {
    path,
    method,
    main,
    auth,
};
