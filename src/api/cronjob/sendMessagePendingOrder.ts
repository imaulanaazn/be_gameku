// import { RequestHandler } from "express";
// import { IApiRouter } from "@interfaces/index";
// import { APIAuth, APIMethod, OrderStatuses } from "@enum/index";
// import { OrderService } from "@serviceInternal/order.service";
// import { Op } from "sequelize";
// import { createLogCronjobInternal } from "@helper/logger";
// import { CustomerEntity } from "@entity/customer.entity";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { Config } from "@config/index";
// import { OrderDetailEntity } from "@entity/orderDetail.entity";

// const path = "/v1/send-message-pending-order";
// const method = APIMethod.GET;
// const auth = APIAuth.GUEST;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const logging = createLogCronjobInternal();
//     logging.log("@@ RUNNING START CRONJOB SEND MESSAGE PENDING ORDER");
//     const config = new Config();
//     const orderService = new OrderService();
//     const orders = await orderService.model.findAll({
//         where: {
//             status: OrderStatuses.PENDING_PAYMENT,
//             [Op.or]: [{ countMessagePending: null }, { countMessagePending: { [Op.lt]: 3 } }],
//         },
//         include: [
//             {
//                 model: CustomerEntity,
//                 required: true,
//                 attributes: ["mobileNumber"],
//             },
//             {
//                 model: OrderDetailEntity,
//                 required: true,
//             },
//         ],
//     });

//     const whatsappTemplateService = new WhatsappTemplateService();
//     const template = await whatsappTemplateService.findOneBy({
//         column: "cd",
//         value: "notify_order_pending",
//     });

//     for (const order of orders) {
//         client.sendNotifyOrder({
//             targetNumber: order.customer.mobileNumber,
//             message: template,
//             isTest: false,
//             noNeedConsole: true,
//             data: {
//                 invoiceId: order.invoiceId,
//                 link: `${config.feUrl}/payment/${order.invoiceId}`,
//                 quantity: order.orderDetail.quantity,
//                 mobileNumber: order.customer.mobileNumber,
//                 amount: order.orderDetail.amount,
//                 game: order.game,
//                 productName: order.productName,
//                 paymentMethod: order.paymentMethod,
//                 feeAmt: order.feeAmt,
//                 totalAmt: order.totalAmt,
//                 discAmt: order.discAmt,
//             },
//         });

//         const oldCount = order.countMessagePending || 0;
//         const newCount = oldCount + 1;
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 countMessagePending: newCount,
//             },
//         });
//     }
//     logging.log("@@ RUNNING END CRONJOB SEND MESSAGE PENDING ORDER");
//     return res.sendStatus(200);
// };

// export const sendMessagePendingOrder: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
