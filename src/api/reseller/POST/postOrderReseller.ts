// import { RequestHandler } from "express";
// import {
//     CustomerService,
//     GameService,
//     OrderService,
//     PaymentMethodService,
//     ProductService,
//     PromotionService,
// } from "@serviceInternal/index";
// import { Config } from "@config/index";
// import {
//     DiscountType,
//     ErrorType,
//     FeeType,
//     InvoiceStatuses,
//     OrderStatuses,
//     OrderType,
//     PaymentsCategory,
//     ServerIdType,
//     ValidatorType,
//     VoucherType,
// } from "@enum/index";
// import { v4 as uuid } from "uuid";
// import { BusinessError } from "@helper/handleError";
// import { Validation, IApiRouter } from "@interfaces/index";
// import { Validator } from "@helper/validator";
// import { XenditService } from "@serviceExternal/xendit.service";
// import { InvoiceService } from "@serviceInternal/invoice.service";
// import { OrderDetailService } from "@serviceInternal/orderDetail.service";
// import dayjs from "dayjs";
// import validator from "validator";
// import { SysConfigService } from "@serviceInternal/sysConfig.service";
// import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
// import { PromotionEntity } from "@entity/promotion.entity";
// import { ListServerService } from "@serviceInternal/listServer.service";
// import { Op } from "sequelize";
// import { OrderEntity } from "@entity/index";
// import APIGamesService from "@serviceExternal/apiGames.service";
// import { FundService } from "@serviceInternal/fund.service";
// import { sleep } from "@helper/index";
// import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
// import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
// import { getIpAddress } from "@helper/getIpAddress";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/reseller/order";
// const method = APIMethod.POST;
// const auth = APIAuth.RESELLER;

// const schemaValidation: Validation[] = [
//     {
//         name: "userId",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "serverId",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "productId",
//         type: "string",
//         required: true,
//     },
//     {
//         name: "quantity",
//         type: "number",
//         required: true,
//         maxNumber: 100,
//     },
//     {
//         name: "paymentId",
//         type: "string",
//         required: true,
//     },
//     {
//         name: "promoCode",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "mobileNumber",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "cashtag",
//         type: "string",
//         required: false,
//     },
// ];
// const main: RequestHandler = async (req, res) => {
//     const ip = req.ip;
//     const body = new Validator(req, res).process<{
//         userId?: string;
//         serverId?: string;
//         productId: string;
//         quantity: number;
//         paymentId: string;
//         promoCode?: string;
//         mobileNumber?: string;
//         cashtag?: string;
//     }>(schemaValidation, ValidatorType.BODY);
//     console.log("REQUEST BODY ORDER");
//     console.log(body);
//     console.log(req.headers["x-forwarded-for"]);
//     const clientIp = getIpAddress(req);
//     console.log(clientIp);
//     console.log(ip);
//     const client = req.client;
//     const io = req.io;
//     console.log(req.reseller);
//     const customer = req.reseller.data;
//     const sysConfigService = new SysConfigService();
//     const sysConfig = await sysConfigService.findOneBy({
//         column: "cd",
//         value: "api_key",
//     });

//     if (body.quantity <= 1) {
//         body.quantity = 1;
//     }

//     const voucherService = new PromotionService();
//     const productService = new ProductService();
//     const paymentMethodService = new PaymentMethodService();
//     const xenditService = new XenditService(sysConfig.value);
//     const orderService = new OrderService();
//     const invoiceService = new InvoiceService();
//     const orderDetailService = new OrderDetailService();
//     const gameService = new GameService();
//     const config = new Config();
//     const fundService = new FundService();

//     const payment = await paymentMethodService.findOneBy({
//         column: "id",
//         value: body.paymentId,
//     });

//     if (!payment) {
//         throw new BusinessError("Payment ID tidak valid", ErrorType.NotFound);
//     }

//     if (payment.cd === "ID_OVO" && !body.mobileNumber) {
//         throw new BusinessError("Metode pembayaran via OVO harus mengisi nomor ovo", ErrorType.Validation);
//     }

//     if (payment.cd === "ID_JENIUSPAY" && !body.cashtag) {
//         throw new BusinessError("Cashtag harus di isi jika memilih pembayaran via Jenius pay", ErrorType.Validation);
//     }

//     if (payment.cd !== "GASSKEUN") {
//         throw new BusinessError("Metode Pembayaran tidak valid", ErrorType.BadRequest);
//     }

//     let balance;
//     if (payment.cd === "GASSKEUN") {
//         const cookie = req.cookies.session_gasskeun_reseller;
//         const reqbalance = await fetch(`http://localhost:${config.port}/api/v1/reseller/balance`, {
//             headers: {
//                 cookie: "session_gasskeun_reseller=" + cookie,
//             },
//         });

//         const resBalance = await reqbalance.json();
//         balance = resBalance;
//     }

//     const product = await productService.findDenomResellerPriceById({ productId: body.productId });
//     if (!product) {
//         throw new BusinessError("Produk ID tidak valid", ErrorType.NotFound);
//     }
//     const discRessellerPermanent = await sysConfigService.findOneBy({
//         column: "cd",
//         value: "percentage_prices_reseller",
//     });
//     const discReseller = parseInt(discRessellerPermanent.value);

//     let prices = product.resellerPrice;
//     if (!product.resellerPrice) {
//         console.log("meow");
//         const disc = (product.price * discReseller) / 100;
//         prices = product.price - disc;
//     }

//     const game = await gameService.findOneBy({
//         column: "id",
//         value: product.gameId,
//     });

//     const gamesNeedClearSeverId = ["mobilelegends", "ML"];
//     if (gamesNeedClearSeverId.includes(game.cd)) {
//         body.serverId = body.serverId.replace(/[^0-9]/g, "");
//     }

//     let serverName = body.serverId;
//     if (game.typeServerId === ServerIdType.LIST) {
//         const serverIdService = new ListServerService();
//         const serverId = await serverIdService.findOneBy({
//             column: "value",
//             value: body.serverId,
//         });

//         if (serverId) {
//             serverName = serverId.label;
//         }
//     }
//     let discount = 0;
//     let voucher: PromotionEntity;
//     if (body.promoCode) {
//         const cookie = req.cookies.session_gasskeun_reseller;
//         const reqCheckPromotion = await fetch(`http://localhost:${config.port}/api/v1/reseller/check-promotion`, {
//             headers: {
//                 cookie: "session_gasskeun_reseller=" + cookie,
//                 "content-type": "application/json",
//             },
//             method: "POST",
//             body: JSON.stringify({
//                 promoCode: body.promoCode,
//                 productId: body.productId,
//                 gameId: game.id,
//                 quantity: body.quantity,
//                 userId: body.userId,
//                 serverId: body.serverId,
//                 isReseller: "true",
//                 customerId: customer.id,
//             }),
//         });

//         const resCheckPromotion = await reqCheckPromotion.json();
//         if (resCheckPromotion.errorCode) {
//             throw new BusinessError(
//                 resCheckPromotion.message || resCheckPromotion.errorMessage,
//                 resCheckPromotion.errorCode,
//             );
//         }

//         voucher = resCheckPromotion;
//     }

//     let fee = 0;
//     if (payment.feeType === FeeType.AMOUNT) {
//         fee = payment.fee;
//     } else if (payment.feeType === FeeType.PERCENTAGE) {
//         fee = Math.ceil((prices * body.quantity * payment.fee) / 100);
//     } else {
//         throw new BusinessError("Sepertinya ada kesalahan, silahkan coba beberapa saat lagi [FEE]", ErrorType.Internal);
//     }

//     const amount = Math.ceil(prices * body.quantity - discount + fee);

//     if (amount < payment.minAmount || amount > payment.maxAmount) {
//         throw new BusinessError(
//             "Pembayaran tidak dapat diproses karena tidak memenuhi syarat jumlah pembayaran.",
//             ErrorType.BadRequest,
//         );
//     }

//     if (payment.cd === "GASSKEUN" && amount > balance.value) {
//         throw new BusinessError("Saldo kamu tidak mencukupi untuk melakukan transaksi", ErrorType.BadRequest);
//     }

//     let checkUsername;
//     if (game.needCheckId) {
//         // const checkingGameService = new CheckingGameIdService();
//         // const checkGameId = await checkingGameService.checking({
//         //     gameCd: game.cd,
//         //     userId: body.userId,
//         //     ...(body.serverId && { serverId: body.serverId }),
//         // });

//         // console.log(checkGameId);

//         // if (!checkGameId) {
//         //     throw new BusinessError(
//         //         `User ID ${game.needServerId ? "Atau Server ID" : ""} tidak valid`,
//         //         ErrorType.BadRequest,
//         //     );
//         // }

//         // username = checkGameId;
//         const configApiGames = await sysConfigService.findManyBy({
//             column: "cd",
//             value: ["api_games_merchant_id", "api_games_secret_key"],
//             operator: "in",
//         });
//         const merchantId = configApiGames.find((item) => item.cd === "api_games_merchant_id");
//         const secretKey = configApiGames.find((item) => item.cd === "api_games_secret_key");
//         const apiGameService = new APIGamesService({
//             merchantId: merchantId.value,
//             secretKey: secretKey.value,
//         });

//         checkUsername = await apiGameService.checkUsernameGame({
//             gameCode: game.cd,
//             userId: body.userId + (body.serverId || ""),
//         });

//         if (checkUsername.status === 0) {
//             throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
//         }

//         if (!checkUsername?.data?.is_valid || checkUsername.error_msg === "Wrong Player ID") {
//             throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
//         } else if (!checkUsername.data.username) {
//             throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
//         }
//     }

//     const invoiceId = `INV${new Date().getTime()}`;
//     const expiredAt = dayjs().tz("Asia/Jakarta").add(payment.durationExpired, payment.durationCd).toDate();
//     let charge: any;

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
//         promoId: (body.promoCode && voucher && voucher.id) || null,
//         customerId: customer.id,
//         invoiceId,
//         paymentMethodId: payment.id,
//         totalAmt: amount,
//         feeAmt: fee,
//         discAmt: discount,
//         status: OrderStatuses.PENDING_PAYMENT,
//         promoCd: body.promoCode ? body.promoCode : "",
//         game: game.name,
//         productName: product.name,
//         paymentMethod: payment.name,
//         amtBuy: Math.ceil(prices * body.quantity),
//         type: OrderType.TOPUP,
//         isNew: checkingOrder <= 0,
//         isGuest: false,
//     });

//     const orderDetail = await orderDetailService.create({
//         id: uuid(),
//         orderId: order.id,
//         productId: product.id,
//         userId: body.userId || "",
//         serverId: serverName || "",
//         amount: prices,
//         quantity: body.quantity,
//         webhookCount: 0,
//         username: checkUsername?.data?.username || null,
//     });

//     const response: any = {
//         id: order.id,
//         invoiceId,
//         totalAmount: amount,
//         productName: product.name,
//         productPrice: prices,
//         fee,
//         discount,
//         paymentName: payment.name,
//         paymentLogo: payment.logo,
//         expiredAt,
//         promoCode: body.promoCode,
//         mobileNumber: customer.mobileNumber,
//         userId: body.userId,
//         serverId: serverName,
//         isExpired: false,
//         category: payment.category,
//     };

//     io.emit("order:new", {
//         id: order.id,
//         invoiceId: invoiceId,
//         customerId: order.customerId,
//         paymentMethodId: order.paymentMethodId,
//         game: order.game,
//         productName: order.productName,
//         paymentMethod: order.paymentMethod,
//         totalAmt: order.totalAmt,
//         feeAmt: order.feeAmt,
//         discAmt: order.discAmt,
//         promoCd: order.promoCd,
//         status: order.status,
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//         completedAt: order.completedAt,
//         productId: product.id,
//         amount: orderDetail.amount,
//         quantity: orderDetail.quantity,
//         logoUrl: game.logoUrl,
//         mobileNumber: customer.mobileNumber,
//     });

//     if (payment.category === PaymentsCategory.EWALLET) {
//         const redirectUrl = config.domainReseller + "/payment/" + invoiceId;
//         let channel_properties = {};

//         //@ts-ignore
//         if (payment.cd === "ID_ASTRAPAY") {
//             channel_properties = {
//                 success_redirect_url: redirectUrl,
//                 failure_redirect_url: redirectUrl,
//             };
//             //@ts-ignore
//         } else if (payment.cd === "ID_OVO") {
//             const mobile_number = `+62${customer.mobileNumber.slice(1)}`;
//             channel_properties = { mobile_number };
//             //@ts-ignore
//         } else if (payment.cd === "ID_JENIUSPAY") {
//             const cashtag = body.cashtag.startsWith("$") ? body.cashtag : "$" + body.cashtag;
//             channel_properties = { cashtag };
//         } else {
//             channel_properties = {
//                 success_redirect_url: redirectUrl,
//             };
//         }

//         charge = await xenditService.createEwalletPayment({
//             reference_id: invoiceId,
//             amount,
//             checkout_method: "ONE_TIME_PAYMENT",
//             currency: "IDR",
//             channel_code: payment.cd,
//             channel_properties,
//             basket: [
//                 {
//                     reference_id: product.id,
//                     name: product.name,
//                     category: "ML",
//                     currency: "IDR",
//                     price: prices,
//                     type: "PRODUCT",
//                     quantity: 1,
//                 },
//             ],
//         });

//         response.actions = charge.actions;
//     } else if (payment.category === PaymentsCategory.QRIS) {
//         charge = await xenditService.createQRISPayment({
//             reference_id: invoiceId,
//             type: "DYNAMIC",
//             currency: "IDR",
//             amount,
//             channel_code: payment.cd,
//             expires_at: expiredAt.toISOString(),
//         });

//         response.qrString = charge.qr_string;
//     } else if (payment.category === PaymentsCategory.VIRTUAL_ACCOUNT) {
//         charge = await xenditService.createVAPayment({
//             external_id: invoiceId,
//             bank_code: payment.cd,
//             name: customer.name || customer.mobileNumber,
//             expiration_date: expiredAt.toISOString(),
//             country: "ID",
//             currency: "IDR",
//             is_single_use: payment.isSingleUse,
//             is_closed: true,
//             expected_amount: amount,
//         });

//         response.accountNumber = charge.account_number;
//     } else if (payment.category === PaymentsCategory.RETAIL) {
//         charge = await xenditService.createRetailPayment({
//             external_id: invoiceId,
//             retail_outlet_name: payment.cd,
//             name: customer.name || customer.mobileNumber,
//             expected_amount: amount,
//             expiration_date: expiredAt.toISOString(),
//             is_single_use: payment.isSingleUse,
//         });

//         response.paymentCode = charge.payment_code;
//     } else if (payment.category === PaymentsCategory.INTERNAL) {
//         try {
//             await fetch(`http://localhost:${config.port}/api/v1/gameku/process-order-success`, {
//                 method: "POST",
//                 headers: {
//                     "content-type": "application/json",
//                     "x-gasskeun-key": config.xApiKeyProcessOrder,
//                 },
//                 body: JSON.stringify({
//                     customerId: customer.id,
//                     orderId: order.id,
//                     invoiceId: invoiceId,
//                 }),
//             });
//         } catch (error) {
//             throw error;
//         }
//     } else {
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.FAILED,
//             },
//         });

//         await invoiceService.updateBy({
//             by: "id",
//             value: invoiceId,
//             data: {
//                 status: InvoiceStatuses.FAILED,
//             },
//         });
//         throw new BusinessError(
//             "Ada kesalahan di category pembayaran, silahkan coba beberapa saat lagi",
//             ErrorType.Internal,
//         );
//     }

//     if (charge?.error_code) {
//         await orderService.updateBy({
//             by: "id",
//             value: order.id,
//             data: {
//                 status: OrderStatuses.FAILED,
//             },
//         });

//         await invoiceService.updateBy({
//             by: "id",
//             value: invoiceId,
//             data: {
//                 status: InvoiceStatuses.FAILED,
//             },
//         });
//         throw new BusinessError(
//             "Sepertinya ada kesalahan dalam pembayaran, silahkan coba beberapa saat lagi",
//             ErrorType.Internal,
//         );
//     }

//     if (payment.cd !== "GASSKEUN") {
//         const whatsappTemplateService = new WhatsappTemplateService();
//         const template = await whatsappTemplateService.findOneBy({
//             column: "cd",
//             value: "order_pending",
//         });

//         client.sendNotifyOrder({
//             targetNumber: customer.mobileNumber,
//             message: template,
//             isTest: false,
//             data: {
//                 invoiceId,
//                 link: `${config.feUrl}/payment/${invoiceId}`,
//                 quantity: body.quantity,
//                 mobileNumber: customer.mobileNumber,
//                 amount: prices,
//                 game: order.game,
//                 productName: order.productName,
//                 paymentMethod: order.paymentMethod,
//                 feeAmt: fee,
//                 totalAmt: amount,
//                 discAmt: order.discAmt,
//             },
//         });

//         await invoiceService.updateBy({
//             by: "id",
//             value: invoiceId,
//             data: {
//                 xenditId: charge.id,
//             },
//         });
//     }
//     return res.send({
//         invoice: invoiceId,
//         expiredAt,
//     });
// };

// export const postOrderReseller: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
