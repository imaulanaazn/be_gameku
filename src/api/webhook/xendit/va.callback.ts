// import { RequestHandler } from "express";

// import { IApiRouter } from "src/interfaces";
// import { OrderService } from "@serviceInternal/order.service";
// import { BusinessError } from "@helper/handleError";
// import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType, VoucherType } from "@enum/index";
// import { ProductService } from "@serviceInternal/product.service";
// import dayjs from "dayjs";
// import { InvoiceService } from "@serviceInternal/invoice.service";
// import { CustomerService } from "@serviceInternal/customer.service";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import { GameService } from "@serviceInternal/game.service";
// import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import APIGamesService from "@serviceExternal/apiGames.service";
// import { SysConfigService } from "@serviceInternal/sysConfig.service";
// import { sleep } from "@helper/index";
// import { FundService } from "@serviceInternal/fund.service";
// import { v4 as uuid } from "uuid";
// import { Config } from "@config/index";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/webhook/va";
// const method = APIMethod.POST;
// const auth = APIAuth.WEBHOOK_XENDIT;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;
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
//     console.log(`Webhook VA diterima [${body.external_id}]`);
//     console.log(JSON.stringify(body));

//     const orderService = new OrderService();
//     const productService = new ProductService();
//     const invoiceService = new InvoiceService();
//     const sysConfigService = new SysConfigService();
//     const configApiGames = await sysConfigService.findManyBy({
//         column: "cd",
//         value: ["api_games_merchant_id", "api_games_secret_key"],
//         operator: "in",
//     });
//     const merchantId = configApiGames.find((item) => item.cd === "api_games_merchant_id");
//     const secretKey = configApiGames.find((item) => item.cd === "api_games_secret_key");
//     const apiGamesService = new APIGamesService({
//         merchantId: merchantId.value,
//         secretKey: secretKey.value,
//     });
//     const fundService = new FundService();

//     const invoice = await invoiceService.findOneBy({
//         column: "id",
//         value: body.external_id,
//     });

//     if (!invoice) {
//         throw new BusinessError(`Order tidak ditemukan dengan invoice: ${body.external_id}`, ErrorType.Internal);
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

//     if (body.amount === order.totalAmt && invoice.status !== InvoiceStatuses.PAID) {
//         const config = new Config();
//         const res = await fetch(`http://localhost:${config.port}/api/v1/gameku/process-order-success`, {
//             method: "POST",
//             headers: {
//                 "content-type": "application/json",
//                 "x-gasskeun-key": config.xApiKeyProcessOrder,
//             },
//             body: JSON.stringify({
//                 customerId: customer.id,
//                 orderId: order.id,
//                 invoiceId: invoice.id,
//             }),
//         });
//         console.log(await res.text());
//         return;
//     } else if (body.amount !== order.totalAmt) {
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

// export const webhookVirtualAccount: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
