import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, OrderStatuses, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { OrderService } from "@serviceInternal/order.service";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { v4 as uuid } from "uuid";
import { CustomerService } from "@serviceInternal/customer.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { GameService } from "@serviceInternal/game.service";
import dayjs from "dayjs";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/order-review";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

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
    throw new BusinessError(
      `Transaksi tidak valid dengan ID ${body.orderId}`,
      ErrorType.BadRequest
    );
  }

  if (order.status !== OrderStatuses.SUCCESS) {
    throw new BusinessError(
      `Tidak bisa memberikan ulasan untuk transaksi ini, karena transaksi tidak/belum sukses`,
      ErrorType.BadRequest
    );
  }

  const orderDetailService = new OrderDetailService();
  const orderDetail = await orderDetailService.findOneBy({
    column: "orderId",
    value: order.id,
  });

  const productService = new ProductService();
  const product = await productService.findOneBy({
    column: "id",
    value: orderDetail.productId,
  });

  const gameService = new GameService();
  const game = await gameService.findOneBy({
    column: "id",
    value: product.gameId,
  });

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
    await orderReviewService.updateBy({
      by: "id",
      value: orderReview.id,
      data: {
        message: body.message,
        rating: body.rating,
        hasUpdated: true,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      },
    });

    res.sendStatus(200);
    return;
  }

  await orderReviewService.create({
    id: uuid(),
    orderId: order.id,
    message: body.message,
    rating: body.rating,
    mobileNumber: customer.mobileNumber || "",
    gameId: game.id || "",
    productId: product.id || "",
    gameName: game.name,
    productName: product.name,
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
