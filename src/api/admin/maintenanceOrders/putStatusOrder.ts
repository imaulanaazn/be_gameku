import { Config } from "@config/index";
import {
  ErrorType,
  OrderStatuses,
  ValidatorType,
  VoucherType,
} from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { GameService } from "@serviceInternal/game.service";
import { OrderService } from "@serviceInternal/order.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/order/:id";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

const paramsValidation: Validation[] = [
  {
    name: "id",
    type: "string",
    required: true,
  },
];

const queryValidation: Validation[] = [
  {
    name: "status",
    type: "string",
    required: true,
  },
];

const main: RequestHandler = async (req, res) => {
  const client = req.client;
  const io = req.io;
  const params = new Validator(req, res).process<{
    id: string;
  }>(paramsValidation, ValidatorType.PARAMS);
  const query = new Validator(req, res).process<{
    status: OrderStatuses.REFUNDED | OrderStatuses.SUCCESS;
  }>(queryValidation, ValidatorType.QUERY);

  const config = new Config();
  const orderService = new OrderService();
  const order = await orderService.findOneBy({
    column: "id",
    value: params.id,
  });

  if (!order) {
    throw new BusinessError("Pesanan tidak valid", ErrorType.BadRequest);
  }
  const orderDetailService = new OrderDetailService();
  const orderDetail = await orderDetailService.findOneBy({
    column: "orderId",
    value: order.id,
  });

  io.emit("order:success", order.id);
  const customerService = new CustomerService();
  const customer = await customerService.findOneBy({
    column: "id",
    value: order.customerId,
  });
  //   const whatsappTemplateService = new WhatsappTemplateService();
  //   const whatsappTemplate = await whatsappTemplateService.findOneBy({
  //     column: "cd",
  //     value: "order_success",
  //   });
  if (order.status === OrderStatuses.FAILED) {
    // client.sendNotifyOrder({
    //   targetNumber: customer.mobileNumber,
    //   message: whatsappTemplate,
    //   isTest: false,
    //   data: {
    //     invoiceId: order.invoiceId,
    //     link: `${config.feUrl}/payment/${order.invoiceId}`,
    //     quantity: orderDetail.quantity || 1,
    //     mobileNumber: customer.mobileNumber,
    //     amount: orderDetail.amount,
    //     game: order.game,
    //     productName: order.productName,
    //     paymentMethod: order.paymentMethod,
    //     feeAmt: order.feeAmt,
    //     totalAmt: order.totalAmt,
    //     discAmt: order.discAmt,
    //   },
    // });

    await orderService.updateBy({
      by: "id",
      value: params.id,
      data: {
        status: query.status,
        completedAt: dayjs().toDate(),
      },
    });
  }

  return res.sendStatus(200);
};

export const putStatusOrder: IApiRouter = {
  path,
  method,
  main,
  auth,
};
