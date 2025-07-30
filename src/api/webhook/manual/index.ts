import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { Config } from "@config/index";
import { APIAuth, APIMethod, ErrorType, InvoiceStatuses } from "@enum/index";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { CustomerEntity, OrderEntity } from "@entity/index";
import { BusinessError } from "@helper/handleError";

const path = "/v1/webhook/manual";
const method = APIMethod.POST;
const auth = APIAuth.WEBHOOK_MANUAL;

const main: RequestHandler = async (req, res) => {
  const body = req.body;
  console.log(
    `WEBHOOK manual ${body.transaction_status} diterima [${body.order_id}]`
  );

  const config = new Config();
  const orderService = new OrderService();
  const invoiceService = new InvoiceService();
  const invoice = await invoiceService.model.findOne({
    where: {
      id: body.order_id,
    },
    include: [
      {
        model: OrderEntity,
        required: true,
        include: [
          {
            model: CustomerEntity,
            required: true,
          },
        ],
      },
    ],
  });

  if (!invoice) {
    throw new BusinessError(
      `Invoice tidak ditemukan dengan invoice: ${body.order_id}`,
      ErrorType.Internal
    );
  }

  if (
    body.transaction_status === "settlement" &&
    invoice.status !== InvoiceStatuses.PAID
  ) {
    console.log("meow");

    await invoiceService.updateBy({
      by: "id",
      value: invoice.id,
      data: {
        status: InvoiceStatuses.PAID,
      },
    });

    const res = await fetch(
      `http://localhost:${config.port}/api/v1/gameku/process-order-success`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gameku-key": config.xApiKeyProcessOrder,
        },
        body: JSON.stringify({
          customerId: invoice.order.customer.id,
          orderId: invoice.order.id,
          invoiceId: invoice.id,
        }),
      }
    );

    console.log(await res.text());
  }

  return res.send({ status: true });
};

export const webhookManual: IApiRouter = {
  path,
  method,
  main,
  auth,
};
