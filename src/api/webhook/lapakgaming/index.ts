// import { RequestHandler } from "express";
// import { IApiRouter } from "src/interfaces";
// import { OrderService } from "@serviceInternal/order.service";
// import { OrderStatuses, DigiflazzStatuses, VoucherType, ResponseCodeDigiflazzOrder } from "@enum/index";
// import dayjs from "dayjs";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import { CustomerService } from "@serviceInternal/customer.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { Config } from "@config/index";
// import { ProductService } from "@serviceInternal/product.service";
// import { GameService } from "@serviceInternal/game.service";
// import { APIAuth, APIMethod } from "@enum/index";
// import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
// import { sendResponseOrderDigiflazz } from "../digiflazz/sendResponseOrder";
// import { FundService } from "@serviceInternal/fund.service";
// import { v4 as uuid } from "uuid";

// const path = "/v1/webhook/lapakgaming";
// const method = APIMethod.POST;
// const auth = APIAuth.WEBHOOK_LAPAKGAMING;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;
//     const body: {
//         code: string;
//         data: {
//             status: "SUCCESS" | "PENDING" | "REFUNDED";
//             tid: string;
//             total_price: number;
//             transactions: {
//                 id: string;
//                 product_name: string;
//                 note: string;
//                 status: string;
//                 voucher_code: string;
//             }[];
//             reference_id: string;
//         };
//     } = req.body;
//     console.log(body);
//     const extTrxId = body.data.tid;
//     const orderService = new OrderService();
//     const orderDetailService = new OrderDetailService();
//     const customerService = new CustomerService();
//     const whatsappTemplateService = new WhatsappTemplateService();
//     const config = new Config();

//     const whatsappTemplate = await whatsappTemplateService.findOneBy({
//         column: "cd",
//         value: "order_success",
//     });
//     const order = await orderService.model.scope("withAmtBuy").findOne({
//         where: {
//             invoiceId: body.data.reference_id,
//             extTrxId,
//         },
//     });

//     if (!order) {
//         console.log("@@ Error Order tidak valid dengan ID = " + extTrxId);
//         return;
//     }

//     const orderDetail = await orderDetailService.findOneBy({
//         column: "orderId",
//         value: order.id,
//     });

//     const productService = new ProductService();
//     const product = await productService.findOneBy({
//         column: "id",
//         value: orderDetail.productId,
//     });

//     const gameService = new GameService();
//     const game = await gameService.findOneBy({
//         column: "id",
//         value: product.gameId,
//     });

//     const customer = await customerService.findOneBy({
//         column: "id",
//         value: order.customerId,
//     });

//     const paymentMethodService = new PaymentMethodService();
//     const paymentMethod = await paymentMethodService.model.findOne({
//         where: {
//             id: order.paymentMethodId,
//         },
//     });

//     res.send(200);
//     if (body.data.status === "SUCCESS") {
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.SUCCESS,
//                 completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
//             },
//         });

//         io.emit("order:success", order.id);
//         // client.sendNotifyOrder({
//         //     targetNumber: customer.mobileNumber,
//         //     message: whatsappTemplate,
//         //     isTest: false,
//         //     data: {
//         //         invoiceId: order.invoiceId,
//         //         link: `${config.feUrl}/payment/${order.invoiceId}`,
//         //         quantity: orderDetail.quantity || 1,
//         //         mobileNumber: customer.mobileNumber,
//         //         amount: orderDetail.amount,
//         //         game: order.game,
//         //         productName: order.productName,
//         //         paymentMethod: order.paymentMethod,
//         //         feeAmt: order.feeAmt,
//         //         totalAmt: order.totalAmt,
//         //         discAmt: order.discAmt,
//         //     },
//         // });

//         if (game.type === "voucher" && game.voucherType === VoucherType.EXTERNAL) {
//             const vouchers = body.data?.transactions?.map((item) => item.voucher_code);
//             if (vouchers && vouchers.length > 0) {
//                 const whatsappTemplate = await whatsappTemplateService.findOneBy({
//                     column: "cd",
//                     value: "voucher",
//                 });

//                 // client.sendNotifyVoucher({
//                 //     targetNumber: customer.mobileNumber,
//                 //     message: whatsappTemplate,
//                 //     isTest: false,
//                 //     data: {
//                 //         gameName: game.name,
//                 //         voucher: vouchers,
//                 //         productName: product.name,
//                 //     },
//                 // });
//             }

//             await orderDetailService.updateBy({
//                 by: "id",
//                 value: orderDetail.id,
//                 data: {
//                     gameVoucher: JSON.stringify(vouchers),
//                 },
//             });
//         }

//         if (order.isSellerDigiflazz) {
//             await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.SUCCESS);
//         }

//         return;
//     } else if (body.data.status === "PENDING") {
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.PROCESSING,
//             },
//         });

//         if (order.isSellerDigiflazz) {
//             await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.PROCESS);
//         }

//         return;
//     } else {
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.FAILED,
//                 remark:
//                     body.data.transactions.map((item) => item.note).join(" | ") ||
//                     "Failed to process order due to an unknown error",
//             },
//         });

//         if (order.isSellerDigiflazz) {
//             await sendResponseOrderDigiflazz(order.invoiceId, ResponseCodeDigiflazzOrder.FAILED);
//         }

//         if (paymentMethod.cd !== "GASSKEUN_USER" && paymentMethod.cd !== "GASSKEUN" && !order.isGuest) {
//             const fundService = new FundService();
//             let fund = await fundService.findOneBy({
//                 column: "customerId",
//                 value: customer.id,
//             });

//             if (!fund) {
//                 await fundService.create({
//                     id: uuid(),
//                     customerId: customer.id,
//                     name: "Gasskeun Coin",
//                     value: 0,
//                 });

//                 fund = await fundService.findOneBy({
//                     column: "customerId",
//                     value: customer.id,
//                 });
//             }
//             await fundService.updateBy({
//                 by: "customerId",
//                 value: customer.id,
//                 data: {
//                     value: Math.ceil(fund.value + order.amtBuy),
//                 },
//             });
//         }

//         io.emit("order:failed", order.id);
//     }
// };

// export const webhookLapakGaming: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
