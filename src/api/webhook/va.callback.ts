// import { RequestHandler } from "express";

// import { IApiRouter } from "src/interfaces";
// import logger from "@helper/logger";
// import { OrderService } from "@serviceInternal/order.service";
// import { BusinessError } from "@helper/handleError";
// import { ErrorType, OrderStatuses } from "@enum/index";
// import { ProductService } from "@serviceInternal/product.service";

// const path = "/v1/webhook/va";
// const method = "POST";
// const auth = "webhook";

// const main: RequestHandler = async (req, res) => {
//     const body: {
//         id: string;
//         payment_id: string;
//         callback_virtual_account_id: string;
//         owner_id: string;
//         external_id: string;
//         account_number: string;
//         bank_code: string;
//         transaction_timestamp: string;
//         amount: number;
//         merchant_code: string;
//         currency: string;
//         country: string;
//         sender_name: string;
//         payment_detail: {
//             payment_interface: string;
//             remark: string;
//             reference: string;
//             sender_account_number: string;
//             sender_channel_code: string;
//             sender_name: string;
//             transfer_method: string;
//         };
//     } = req.body;
//     logger.info(`Webhook VA diterima [${body.external_id}]`);
//     logger.info(JSON.stringify(body));

//     const orderService = new OrderService();
//     const productService = new ProductService();
//     const order = await orderService.findOneBy({
//         xenditId: body.callback_virtual_account_id,
//         invoiceId: body.external_id,
//     });

//     if (!order) {
//         throw new BusinessError(
//             `Order invalid dengan callback_virtual_account_id: ${body.callback_virtual_account_id} & external_id: ${body.external_id}`,
//             ErrorType.NotFound,
//         );
//     }
//     if (order.totalAmount !== body.amount) {
//         logger.info(`Amount berbeda, seharusnya: ${order.totalAmount}, dibayarkan: ${body.amount}`);
//         logger.info(`Memproses update order partial paid`);
//         await orderService.updateById(order.id, {
//             status: OrderStatuses.PARTIAL_PAID,
//         });

//         return res.sendStatus(200);
//     }

//     const product = await productService.findById(order.productId);
//     if (!product) {
//         throw new BusinessError(`Produl dengan id ${order.productId} tidak ditemukan`, ErrorType.Internal);
//     }

//     logger.info("Data berhasil divalidasi, memproses update order");

//     // TODO ORDER SESUAI GAME
//     // .....
//     // TODO ORDER SESUAI GAME
//     logger.info(`Berhasil order untuk game ${product.name}`);

//     await orderService.updateById(order.id, {
//         status: OrderStatuses.PAID,
//         completedAt: new Date(),
//     });
//     res.sendStatus(200);
// };

// export const webhookVirtualAccount: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
