import { Config } from "@config/index";
import {
  OrderStatuses,
  ResponseCodeDigiflazzOrder,
  ValidatorType,
} from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { GameService } from "@serviceInternal/game.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { OrderService } from "@serviceInternal/order.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { APIAuth, APIMethod } from "@enum/index";
// import { sendResponseOrderDigiflazz } from "../digiflazz/sendResponseOrder";
import sequelize from "../../../database/index";

const path = "/v1/gasskeun/process-voucher-internal";
const method = APIMethod.POST;
const auth = APIAuth.WEBHOOK_INTERNAL;
const schemaValidation: Validation[] = [
  {
    name: "customerId",
    required: true,
    type: "string",
  },
  {
    name: "orderId",
    required: true,
    type: "string",
  },
  {
    name: "gameId",
    required: true,
    type: "string",
  },
  {
    name: "productId",
    required: true,
    type: "string",
  },
];

const main: RequestHandler = async (req, res) => {
  const io = req.io;
  const client = req.client;
  const body = new Validator(req, res).process<{
    customerId: string;
    orderId: string;
    gameId: string;
    productId: string;
  }>(schemaValidation, ValidatorType.BODY);

  const gameVoucherService = new GameVoucherService();
  const orderService = new OrderService();
  const orderDetailService = new OrderDetailService();
  const customerService = new CustomerService();
  const productService = new ProductService();
  const gameService = new GameService();

  const order = await orderService.findOneBy({
    column: "id",
    value: body.orderId,
  });

  const transaction = await sequelize.transaction();
  try {
    const orderDetail = await orderDetailService.model.findOne({
      where: {
        orderId: order.id,
      },
      transaction,
    });

    const gameVouchers = await gameVoucherService.model.findAll({
      where: {
        gameId: body.gameId,
        productId: body.productId,
        used: false,
      },
      limit: orderDetail.quantity,
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const customer = await customerService.findOneBy({
      column: "id",
      value: body.customerId,
    });

    const product = await productService.findOneBy({
      column: "id",
      value: body.productId,
    });

    const game = await gameService.findOneBy({
      column: "id",
      value: body.gameId,
    });

    let vouchers = [];

    if (gameVouchers.length === 0) {
      vouchers.push(null);
    } else {
      const gameVouchersId = gameVouchers.map((item) => item.id);
      vouchers = gameVouchers.map((item) => item.code);
      await gameVoucherService.model.update(
        { used: true },
        {
          where: { id: gameVouchersId },
          transaction,
        }
      );
    }

    await orderDetailService.model.update(
      {
        gameVoucher: JSON.stringify(vouchers),
      },
      {
        where: {
          id: orderDetail.id,
        },
        transaction,
      }
    );

    await orderService.model.update(
      {
        status: OrderStatuses.SUCCESS,
        completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        where: {
          id: order.id,
        },
        transaction,
      }
    );

    await transaction.commit();
    io.emit("order:success", order.id);

    // const whatsappTemplateService = new WhatsappTemplateService();
    // const whatsappTemplate = await whatsappTemplateService.findOneBy({
    //   column: "cd",
    //   value: "voucher",
    // });

    // if (order.isSellerDigiflazz) {
    //   await sendResponseOrderDigiflazz(
    //     order.invoiceId,
    //     ResponseCodeDigiflazzOrder.SUCCESS
    //   );
    // } else {
    //   client.sendNotifyVoucher({
    //     targetNumber: customer.mobileNumber,
    //     message: whatsappTemplate,
    //     isTest: false,
    //     data: {
    //       gameName: game.name,
    //       voucher: vouchers,
    //       productName: product.name,
    //     },
    //   });
    // }

    res.sendStatus(200);
  } catch (error) {
    if (transaction) await transaction.rollback();

    // if (order.isSellerDigiflazz) {
    //   await sendResponseOrderDigiflazz(
    //     order.invoiceId,
    //     ResponseCodeDigiflazzOrder.FAILED,
    //     "Something wrong"
    //   );
    // } else {
    console.log(error);
    res.sendStatus(500);
    return;
    // }
  }
};

export const processVoucherInternal: IApiRouter = {
  main,
  method,
  auth,
  path,
  xApiKey: new Config().xApiKeyGameVoucher,
};
