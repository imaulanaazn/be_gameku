// import { RequestHandler } from "express";

// import { IApiRouter } from "src/interfaces";
// import { OrderService } from "@serviceInternal/order.service";
// import { BusinessError } from "@helper/handleError";
// import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType, VoucherType } from "@enum/index";
// import { ProductService } from "@serviceInternal/product.service";
// import { InvoiceService } from "@serviceInternal/invoice.service";
// import dayjs from "dayjs";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { GameService } from "@serviceInternal/game.service";
// import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import { CustomerService } from "@serviceInternal/customer.service";
// import APIGamesService from "@serviceExternal/apiGames.service";
// import { SysConfigService } from "@serviceInternal/sysConfig.service";
// import { sleep } from "@helper/index";
// import { FundService } from "@serviceInternal/fund.service";
// import { v4 as uuid } from "uuid";
// import { Config } from "@config/index";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/webhook/qris";
// const method = APIMethod.POST;
// const auth = APIAuth.WEBHOOK_XENDIT;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;
//     const body: {
//         created: string;
//         business_id: string;
//         event: string;
//         api_version: string;
//         data: {
//             amount: number;
//             basket: string;
//             business_id: string;
//             channel_code: string;
//             created: string;
//             currency: string;
//             expires_at: string;
//             id: string;
//             metadata: string;
//             payment_detail: {
//                 account_details: string;
//                 name: string;
//                 receipt_id: string;
//                 source: string;
//             };
//             qr_id: string;
//             qr_string: string;
//             reference_id: string;
//             status: string;
//             type: string;
//         };
//     } = req.body;
//     console.log(`Webhook QRIS diterima [${body.data.reference_id}]`);
//     console.log("Request Body", body);

//     const orderService = new OrderService();
//     const invoiceService = new InvoiceService();
//     const invoice = await invoiceService.findOneBy({
//         column: "id",
//         value: body.data.reference_id,
//     });

//     if (!invoice) {
//         throw new BusinessError(`Order tidak ditemukan dengan invoice: ${body.data.reference_id}`, ErrorType.Internal);
//     }

//     const order = await orderService.findOneBy({
//         column: "invoiceId",
//         value: invoice.id,
//     });

//     const customerService = new CustomerService();
//     const customer = await customerService.findOneBy({
//         column: "id",
//         value: order.customerId,
//     });

//     if (body.data.status === "SUCCEEDED" && invoice.status !== InvoiceStatuses.PAID) {
//         const config = new Config();
//         const res = await fetch(`http://localhost:${config.port}/api/v1/gameku/process-order-success`, {
//             method: "POST",
//             headers: {
//                 "content-type": "application/json",
//                 "x-gameku-key": config.xApiKeyProcessOrder,
//             },
//             body: JSON.stringify({
//                 customerId: customer.id,
//                 orderId: order.id,
//                 invoiceId: invoice.id,
//             }),
//         });
//         console.log(await res.text());
//         return;
//     } else if (body.data.status === "FAILED") {
//         await invoiceService.updateBy({
//             by: "id",
//             value: invoice.id,
//             data: {
//                 status: InvoiceStatuses.FAILED,
//             },
//         });

//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.FAILED,
//             },
//         });

//         io.emit("order:failed", order.id);
//     }
// };

// export const webhookQris: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
