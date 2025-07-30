// import { RequestHandler } from "express";

// import { IApiRouter } from "src/interfaces";
// import { OrderService } from "@serviceInternal/order.service";
// import { BusinessError } from "@helper/handleError";
// import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType, VoucherType } from "@enum/index";
// import { ProductService } from "@serviceInternal/product.service";
// import dayjs from "dayjs";
// import { InvoiceService } from "@serviceInternal/invoice.service";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import { GameService } from "@serviceInternal/game.service";
// import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { CustomerService } from "@serviceInternal/customer.service";
// import APIGamesService from "@serviceExternal/apiGames.service";
// import { SysConfigService } from "@serviceInternal/sysConfig.service";
// import { sleep } from "@helper/index";
// import { FundService } from "@serviceInternal/fund.service";
// import { v4 as uuid } from "uuid";
// import { Config } from "@config/index";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/webhook/ewallet";
// const method = APIMethod.POST;
// const auth = APIAuth.WEBHOOK_XENDIT;

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;
//     const body: {
//         event: string;
//         business_id: string;
//         created: string;
//         data: {
//             id: string;
//             business_id: string;
//             reference_id: string;
//             status: string;
//             currency: string;
//             charge_amount: number;
//             capture_amount: number;
//             checkout_method: string;
//             channel_code: string;
//             channel_properties: {
//                 success_redirect_url: string;
//             };
//             actions: {
//                 desktop_web_checkout_url: string | null;
//                 mobile_web_checkout_url: string | null;
//                 mobile_deeplink_checkout_url: string | null;
//                 qr_checkout_string: string;
//             };
//             is_redirect_required: boolean;
//             callback_url: string;
//             created: string;
//             updated: string;
//             voided_at: string | null;
//             capture_now: boolean;
//             customer_id: string | null;
//             payment_method_id: string | null;
//             failure_code: string | null;
//             basket: null;
//             metadata: {
//                 branch_code: string;
//             };
//         };
//     } = req.body;
//     console.log(`Webhook VA diterima [${body.data.reference_id}]`);
//     console.log(JSON.stringify(body));

//     const config = new Config();
//     const orderService = new OrderService();
//     const invoiceService = new InvoiceService();
//     const invoice = await invoiceService.findOneBy({
//         column: "id",
//         value: body.data.reference_id,
//     });

//     if (!invoice) {
//         throw new BusinessError(
//             `Invoice tidak ditemukan dengan invoice: ${body.data.reference_id}`,
//             ErrorType.Internal,
//         );
//     }

//     const order = await orderService.findOneBy({
//         column: "invoiceId",
//         value: invoice.id,
//     });

//     res.sendStatus(200);

//     const customerService = new CustomerService();
//     const customer = await customerService.findOneBy({
//         column: "id",
//         value: order.customerId,
//     });

//     if (body.data.status === "SUCCEEDED" && invoice.status !== InvoiceStatuses.PAID) {
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
//     } else {
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

// export const webhookEwallet: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
