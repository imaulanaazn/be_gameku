// import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType, ValidatorType } from "@enum/index";
// import { BusinessError } from "@helper/handleError";
// import { Validator } from "@helper/validator";
// import { Validation, IApiRouter } from "@interfaces/index";
// import { RequestHandler } from "express";
// import { v4 as uuid } from "uuid";
// import dayjs from "dayjs";
// import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
// import { OrderService } from "@serviceInternal/order.service";
// import { InvoiceService } from "@serviceInternal/invoice.service";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import { Op } from "sequelize";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/reseller/topup";
// const method = APIMethod.POST;
// const auth = APIAuth.RESELLER;

// const schemaValidation: Validation[] = [
//     {
//         name: "amount",
//         type: "number",
//         required: true,
//     },
// ];

// const main: RequestHandler = async (req, res) => {
//     const body = new Validator(req, res).process<{
//         amount: number;
//     }>(schemaValidation, ValidatorType.BODY);
//     console.log(body);
//     console.log(req.headers["x-forwarded-for"]);
//     const customer = req.reseller.data;
//     const io = req.io;

//     const paymentMethodService = new PaymentMethodService();
//     const payment = await paymentMethodService.model.findOne({
//         where: {
//             cd: "GASSKEUN_DEPOSIT",
//         },
//     });

//     if (body.amount < payment.minAmount) {
//         throw new BusinessError(`Tidak memenuhi minimal deposit`, ErrorType.BadRequest);
//     }

//     const invoiceId = `INV-T${new Date().getTime()}`;
//     const expiredAt = dayjs().tz("Asia/Jakarta").add(24, "day").toDate();
//     const invoiceService = new InvoiceService();
//     const orderService = new OrderService();
//     const checkingOrder = await orderService.model.count({
//         where: {
//             customerId: customer.id,
//             type: {
//                 [Op.in]: [OrderType.TOPUP, null],
//             },
//         },
//     });
//     await invoiceService.create({
//         id: invoiceId,
//         status: InvoiceStatuses.PENDING,
//         expiredAt,
//     });

//     const order = await orderService.create({
//         id: uuid(),
//         promoId: null,
//         customerId: customer.id,
//         invoiceId,
//         paymentMethodId: payment.id,
//         totalAmt: body.amount,
//         feeAmt: 0,
//         discAmt: 0,
//         status: OrderStatuses.PENDING_PAYMENT,
//         promoCd: null,
//         game: "Gasskeun",
//         productName: "Topup Saldo Gasskeun",
//         paymentMethod: payment.name,
//         amtBuy: 0,
//         type: OrderType.BUY,
//         isNew: checkingOrder <= 0,
//     });

//     const orderDetailService = new OrderDetailService();
//     const orderDetail = await orderDetailService.create({
//         id: uuid(),
//         orderId: order.id,
//         productId: null,
//         userId: null,
//         serverId: null,
//         amount: body.amount,
//         quantity: 1,
//         webhookCount: 0,
//         username: null,
//     });

//     let response: any = {
//         invoiceId,
//         paymentMethod: payment.name,
//         expiredAt,
//         paymentCd: payment.cd,
//         paymentCategory: payment.category,
//         feeAmt: 0,
//         totalAmt: body.amount,
//         amt: body.amount,
//     };

//     return res.send(response);
// };

// export const postTopupFund: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
