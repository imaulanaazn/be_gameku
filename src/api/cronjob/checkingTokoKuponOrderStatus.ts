// import { RequestHandler } from "express";
// import { IApiRouter } from "@interfaces/index";
// import { OrderStatuses } from "@enum/index";
// import { OrderService } from "@serviceInternal/order.service";
// import { createLogCronjobKupon } from "@helper/logger";
// import { ProviderService } from "@serviceInternal/provider.service";
// import { OrderPending3rdPartyService } from "@serviceInternal/orderPending3rdParty.service";
// import { KuponService } from "@serviceExternal/kupon.service";
// import { SysConfigService } from "@serviceInternal/sysConfig.service";
// import dayjs from "dayjs";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { Config } from "@config/index";
// import { OrderDetailEntity } from "@entity/orderDetail.entity";
// import { CustomerEntity } from "@entity/customer.entity";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/toko-kupon-order-statuses";
// const method = APIMethod.GET;
// const auth = APIAuth.GUEST;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;
//     const logging = createLogCronjobKupon();
//     logging.log("@@ RUNNING START CRONJOB CHECK ORDER STATUSES");
//     const whatsappTemplateService = new WhatsappTemplateService();
//     const config = new Config();

//     const whatsappTemplate = await whatsappTemplateService.findOneBy({
//         column: "cd",
//         value: "order_success",
//     });
//     const providerService = new ProviderService();
//     const provider = await providerService.findOneBy({
//         column: "cd",
//         value: "KUPON",
//     });

//     const orderPending3rdPartyService = new OrderPending3rdPartyService();
//     const dataOrderPending = await orderPending3rdPartyService.findManyBy({
//         column: "providerId",
//         value: provider.id,
//     });

//     const sysConfigService = new SysConfigService();
//     const configDb = await sysConfigService.findOneBy({
//         column: "cd",
//         value: "kupon_apikey",
//     });

//     const inv = dataOrderPending.map((item) => item.extInvoiceNumber);
//     logging.log(inv);
//     logging.log("Total Data Order Toko Kupon " + inv.length);
//     const tokoKuponService = new KuponService(configDb.value);
//     const orderService = new OrderService();
//     for (const orderPending of dataOrderPending) {
//         const orderStatuses = await tokoKuponService.getOrderStatuses(orderPending.extInvoiceNumber);
//         const order = await orderService.model.findOne({
//             where: {
//                 extTrxId: orderPending.extInvoiceNumber,
//             },
//             include: [
//                 {
//                     model: OrderDetailEntity,
//                     required: true,
//                 },
//                 {
//                     model: CustomerEntity,
//                     required: true,
//                 },
//             ],
//         });
//         if (orderStatuses.data.order[0].status === "completed") {
//             await orderService.updateBy({
//                 by: "id",
//                 value: order.id,
//                 data: {
//                     status: OrderStatuses.SUCCESS,
//                     completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
//                 },
//             });

//             await orderPending3rdPartyService.deleteBy({
//                 by: "id",
//                 value: orderPending.id,
//             });

//             io.emit("order:success", order.id);
//             client.sendNotifyOrder({
//                 targetNumber: order.customer.mobileNumber,
//                 message: whatsappTemplate,
//                 isTest: false,
//                 data: {
//                     invoiceId: order.invoiceId,
//                     link: `${config.feUrl}/payment/${order.invoiceId}`,
//                     quantity: order.orderDetail.quantity || 1,
//                     mobileNumber: order.customer.mobileNumber,
//                     amount: order.orderDetail.amount,
//                     game: order.game,
//                     productName: order.productName,
//                     paymentMethod: order.paymentMethod,
//                     feeAmt: order.feeAmt,
//                     totalAmt: order.totalAmt,
//                     discAmt: order.discAmt,
//                 },
//             });
//         }
//     }
//     logging.log("@@ RUNNING END CRONJOB CHECK ORDER STATUSES");
//     return res.sendStatus(200);
// };

// export const checkingTokoKuponOrderStatus: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
