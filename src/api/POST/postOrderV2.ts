import { RequestHandler } from "express";
import {
    CustomerService,
    GameService,
    OrderService,
    PaymentMethodService,
    ProductService,
    PromotionService,
} from "@serviceInternal/index";
import { Config } from "@config/index";
import {
    CustomerStatuses,
    DiscountType,
    ErrorType,
    FeeType,
    InvoiceStatuses,
    OrderStatuses,
    OrderType,
    PaymentsCategory,
    ServerIdType,
    ValidatorType,
} from "@enum/index";
import { v4 as uuid } from "uuid";
import { BusinessError } from "@helper/handleError";
import { Validation, IApiRouter } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { XenditService } from "@serviceExternal/xendit.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import dayjs from "dayjs";
import validator from "validator";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { PromotionEntity } from "@entity/promotion.entity";
import { ListServerService } from "@serviceInternal/listServer.service";
import { Op } from "sequelize";
import { OrderEntity } from "@entity/index";
import APIGamesService from "@serviceExternal/apiGames.service";
import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
import { getClientIp } from "request-ip";
import { getIpAddress } from "@helper/getIpAddress";
import { TokopayService } from "@serviceExternal/tokopay.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v2/order";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "userId",
        type: "string",
        required: false,
    },
    {
        name: "serverId",
        type: "string",
        required: false,
    },
    {
        name: "productId",
        type: "string",
        required: true,
    },
    {
        name: "quantity",
        type: "number",
        required: true,
        maxNumber: 100,
    },
    {
        name: "paymentId",
        type: "string",
        required: true,
    },
    {
        name: "promoCode",
        type: "string",
        required: false,
    },
    {
        name: "mobileNumber",
        type: "string",
        required: true,
        isMobileNo: true,
    },
    {
        name: "cashtag",
        type: "string",
        required: false,
    },
    {
        name: "customerId",
        type: "string",
        required: false,
    },
];
const main: RequestHandler = async (req, res) => {
    const ip = req.ip;
    const body = new Validator(req, res).process<{
        userId?: string;
        serverId?: string;
        productId: string;
        quantity: number;
        paymentId: string;
        promoCode?: string;
        mobileNumber: string;
        cashtag?: string;
        customerId?: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log("REQUEST BODY ORDER");
    console.log(body);
    console.log(req.headers["x-forwarded-for"]);
    const clientIp = getIpAddress(req);
    console.log(clientIp);
    console.log(ip);
    const client = req.client;
    const io = req.io;
    body.userId = body.userId.trimEnd();
    body.serverId = body.serverId?.trimEnd();

    if (body.quantity <= 1) {
        body.quantity = 1;
    }

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: [
            "api_key",
            "api_games_merchant_id",
            "api_games_secret_key",
            "tokopay_merchant_id",
            "tokopay_secret_key",
        ],
        operator: "in",
    });

    const voucherService = new PromotionService();
    const productService = new ProductService();
    const paymentMethodService = new PaymentMethodService();
    const orderService = new OrderService();
    const customerService = new CustomerService();
    const invoiceService = new InvoiceService();
    const orderDetailService = new OrderDetailService();
    const gameService = new GameService();
    const config = new Config();

    const convertedNumber = body.mobileNumber.replace(/^(\+62|62|0)?(\d+)/, "0$2");
    const check = validator.isMobilePhone(convertedNumber, "id-ID");
    if (!check) {
        throw new BusinessError("Nomor Whatsapp tidak valid", ErrorType.BadRequest);
    }

    let customer = await customerService.model.findOne({
        where: {
            mobileNumber: convertedNumber,
            roleId: {
                [Op.in]: [config.roleGuest, config.roleUser],
            },
        },
    });

    if (!customer) {
        customer = await customerService.create({
            id: uuid(),
            roleId: config.roleGuest,
            mobileNumber: convertedNumber,
            isActive: true,
            isRegistered: false,
            status: CustomerStatuses.ACTIVE,
            loginAttemps: 0,
            lockUntil: null,
        });
    }
    const payment = await paymentMethodService.model.findOne({
        where: {
            id: body.paymentId,
            deleted: false,
            isActive: true,
            cd: {
                [Op.notIn]: ["GASSKEUN", "GASSKEUN_DEPOSIT"],
            },
        },
    });
    // const payment = await paymentMethodService.findOneBy({
    //     column: "id",
    //     value: body.paymentId,
    // });

    if (!payment) {
        throw new BusinessError("Metode Pembayaran tidak valid", ErrorType.NotFound);
    }

    if (payment.cd === "ID_JENIUSPAY" && !body.cashtag) {
        throw new BusinessError("Cashtag harus di isi jika memilih pembayaran via Jenius pay", ErrorType.Validation);
    }

    const product = await productService.findOneBy({
        column: "id",
        value: body.productId,
    });

    if (!product) {
        throw new BusinessError("Produk ID tidak valid", ErrorType.NotFound);
    }

    const game = await gameService.findOneBy({
        column: "id",
        value: product.gameId,
    });

    const gamesNeedClearSeverId = ["mobilelegends", "ML"];
    if (gamesNeedClearSeverId.includes(game.cd)) {
        body.serverId = body.serverId.replace(/[^0-9]/g, "");
    }

    let serverName = body.serverId;
    if (game.typeServerId === ServerIdType.LIST) {
        const serverIdService = new ListServerService();
        const serverId = await serverIdService.findOneBy({
            column: "value",
            value: body.serverId,
        });

        if (serverId) {
            serverName = serverId.label;
        }
    }
    let discount = 0;
    let voucher;
    if (body.promoCode) {
        voucher = await voucherService.findAvailablePromoBypromoCode(body.promoCode);
        if (!voucher) {
            throw new BusinessError(`Kode Promo tidak valid atau kadaluarsa`, ErrorType.NotFound);
        }
        if (body.userId || body.serverId) {
            const conditions = [];

            if (body.userId) {
                conditions.push({ userId: body.userId });
            }
            // if (body.serverId) {
            //     conditions.push({ serverId: body.serverId });
            // }
            const orderDetail = await orderDetailService.model.findAll({
                where: {
                    [Op.or]: conditions,
                },
                include: [
                    {
                        model: OrderEntity,
                        required: true,
                        where: {
                            promoId: voucher.id,
                            status: {
                                [Op.in]: [
                                    OrderStatuses.PENDING_ORDER,
                                    OrderStatuses.SUCCESS,
                                    OrderStatuses.PENDING_PAYMENT,
                                    OrderStatuses.PROCESSING,
                                ],
                            },
                        },
                    },
                ],
            });

            if (orderDetail.length > 0) {
                throw new BusinessError("Kode promo pernah sudah digunakan", ErrorType.BadRequest);
            }
        }

        let customerId = [];
        const customer = await customerService.findOneBy({
            column: "mobileNumber",
            value: convertedNumber,
        });

        if (customer) {
            customerId.push(customer.id);
        }

        if (body.customerId) {
            customerId.push(body.customerId);
        }
        const order = await orderService.model.findAll({
            where: {
                [Op.or]: [
                    {
                        customerId: {
                            [Op.in]: customerId,
                        },
                    },
                    {
                        ipAddress: clientIp,
                    },
                ],
                promoId: voucher.id,
                status: {
                    [Op.in]: [
                        OrderStatuses.PENDING_ORDER,
                        OrderStatuses.SUCCESS,
                        OrderStatuses.PENDING_PAYMENT,
                        OrderStatuses.PROCESSING,
                    ],
                },
            },
        });

        if (order.length > 0) {
            throw new BusinessError("Kode promo sudah pernah digunakan", ErrorType.BadRequest);
        }

        const usedVoucher = await orderService.model.count({
            where: {
                promoId: voucher.id,
                status: {
                    [Op.in]: [
                        OrderStatuses.PENDING_ORDER,
                        OrderStatuses.SUCCESS,
                        OrderStatuses.PENDING_PAYMENT,
                        OrderStatuses.PROCESSING,
                    ],
                },
            },
        });

        if (usedVoucher >= voucher.stock) {
            throw new BusinessError("Kode promo telah habis", ErrorType.BadRequest);
        }

        if (voucher.gameId && !product.gameId) {
            throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
        }

        if (voucher.gameId && voucher.gameId !== product.gameId) {
            throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
        }

        if (voucher && product.price * body.quantity >= voucher.minPurchase) {
            if (voucher.discountType === DiscountType.PERCENTAGE) {
                const disc = (voucher.discountValue / 100) * (product.price * body.quantity);
                discount = disc > voucher.maxDiscount ? voucher.maxDiscount : disc;
            } else {
                discount = voucher.discountValue;
            }
        } else if (voucher) {
            throw new BusinessError(
                "Kode Promo yang dimasukkan tidak memenuhi minimal pembelian",
                ErrorType.BadRequest,
            );
        }
    }

    let fee = 0;
    if (payment.feeType === FeeType.AMOUNT) {
        fee = payment.fee;
    } else if (payment.feeType === FeeType.PERCENTAGE) {
        fee = Math.ceil((product.price * body.quantity * payment.fee) / 100);
    } else {
        throw new BusinessError("Sepertinya ada kesalahan, silahkan coba beberapa saat lagi [FEE]", ErrorType.Internal);
    }

    let amount = Math.ceil(product.price * body.quantity - discount + fee);

    if (amount < payment.minAmount || amount > payment.maxAmount) {
        throw new BusinessError(
            "Pembayaran tidak dapat diproses karena tidak memenuhi syarat jumlah pembayaran.",
            ErrorType.BadRequest,
        );
    }

    if (payment.providerCd === "TOKOPAY" && payment.category === "6") {
        const newAmount = Math.ceil(amount / 1000) * 1000;
        fee = fee + newAmount - amount;
        amount = newAmount;
    }

    let checkUsername;
    if (game.needCheckId) {
        // const checkingGameService = new CheckingGameIdService();
        // const checkGameId = await checkingGameService.checking({
        //     gameCd: game.cd,
        //     userId: body.userId,
        //     ...(body.serverId && { serverId: body.serverId }),
        // });

        // if (!checkGameId) {
        //     throw new BusinessError(
        //         `User ID ${game.needServerId ? "Atau Server ID" : ""} tidak valid`,
        //         ErrorType.BadRequest,
        //     );
        // }
        // if (game.cd === "VALORANT") {
        //     username = body.userId?.split("#")[0] || body.userId;
        // } else {
        //     username = checkGameId;
        // }
        const merchantId = sysConfig.find((item) => item.cd === "api_games_merchant_id");
        const secretKey = sysConfig.find((item) => item.cd === "api_games_secret_key");
        const apiGameService = new APIGamesService({
            merchantId: merchantId.value,
            secretKey: secretKey.value,
        });

        checkUsername = await apiGameService.checkUsernameGame({
            gameCode: game.cd,
            userId: body.userId + (body.serverId || ""),
        });

        if (checkUsername.status === 0) {
            throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
        }

        if (!checkUsername?.data?.is_valid || checkUsername.error_msg === "Wrong Player ID") {
            throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
        } else if (!checkUsername.data.username) {
            throw new BusinessError("User ID tidak valid, silahkan check kembali dan coba lagi", ErrorType.BadRequest);
        }
    }

    const invoiceId = `INV${new Date().getTime()}`;
    const expiredAt = dayjs().tz("Asia/Jakarta").add(payment.durationExpired, payment.durationCd).toDate();

    const checkingOrder = await orderService.model.count({
        where: {
            customerId: customer.id,
            type: {
                [Op.in]: [OrderType.TOPUP, null],
            },
        },
    });

    await invoiceService.create({
        id: invoiceId,
        status: InvoiceStatuses.PENDING,
        expiredAt,
    });

    const order = await orderService.create({
        id: uuid(),
        promoId: (body.promoCode && voucher && voucher.id) || null,
        customerId: customer.id,
        invoiceId,
        paymentMethodId: payment.id,
        totalAmt: amount,
        feeAmt: fee,
        discAmt: discount,
        status: OrderStatuses.PENDING_PAYMENT,
        promoCd: body.promoCode ? body.promoCode : "",
        game: game.name,
        productName: product.name,
        paymentMethod: payment.name,
        amtBuy: Math.ceil(product.price * body.quantity),
        type: OrderType.TOPUP,
        ipAddress: clientIp,
        isNew: checkingOrder <= 0,
    });

    const orderDetail = await orderDetailService.create({
        id: uuid(),
        orderId: order.id,
        productId: product.id,
        userId: body.userId || "",
        serverId: serverName || "",
        amount: product.price,
        quantity: body.quantity,
        webhookCount: 0,
        // username: username || null,
        username: checkUsername?.data?.username || null,
    });

    if (payment.providerCd === "TOKOPAY") {
        const tokopayMerchantID = sysConfig.find((item) => item.cd === "tokopay_merchant_id");
        const tokopaySecretKey = sysConfig.find((item) => item.cd === "tokopay_secret_key");
        const tokopayService = new TokopayService({
            merchantID: tokopayMerchantID.value,
            secretKey: tokopaySecretKey.value,
        });

        const tokopayInvoices = await tokopayService.createInvoice({
            paymentCode: payment.cd,
            invoiceId,
            // totalAmt: amount,
            totalAmt: amount,
            customer: {
                name: customer.name || "Gasskeun Topup",
                email: customer.email || "guess@gasskeuntopup.com",
                mobileNumber: customer.mobileNumber,
            },
            expiredAt: expiredAt.getTime() / 1000,
            product: {
                gameName: game.name,
                code: product.code,
                name: product.name,
                price: product.price,
                gameImageUrl: game.logoUrl,
                quantity: body.quantity,
                gameSlug: game.slug,
            },
        });

        if (tokopayInvoices.status !== "Success") {
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.FAILED,
                    isError: true,
                    isCanResend: false,
                    remark: JSON.stringify(tokopayInvoices.error_msg || "Ada kesalahan ketika membuat pembayaran"),
                },
            });

            await invoiceService.updateBy({
                by: "id",
                value: invoiceId,
                data: {
                    status: InvoiceStatuses.FAILED,
                },
            });

            throw new BusinessError(
                "Ada kesalahan ketika membuat order, silahkan coba beberapa saat lagi",
                ErrorType.Internal,
            );
        }

        await invoiceService.updateBy({
            by: "id",
            value: invoiceId,
            data: {
                xenditId: tokopayInvoices.data.trx_id,
            },
        });

        if (payment.cd === "OVOPUSH") {
            console.log("@@@ PUSH NOTIF OVO");
            const pushNotifOVO = await tokopayService.pushNotificationOvo({
                mobileNumber: customer.mobileNumber,
                extTrxId: tokopayInvoices.data.trx_id,
            });
            console.log(pushNotifOVO);
            console.log("@@@ PUSH NOTIF OVO");
        }
    } else if (payment.providerCd === "XENDIT") {
        const xenditSecretKey = sysConfig.find((item) => item.cd === "api_key");
        const xenditService = new XenditService(xenditSecretKey.value);
        let charge;
        if (payment.category === PaymentsCategory.EWALLET) {
            const redirectUrl = config.feUrl + "/payment/" + invoiceId;
            let channel_properties = {};
            if (payment.cd === "ID_ASTRAPAY") {
                channel_properties = {
                    success_redirect_url: redirectUrl,
                    failure_redirect_url: redirectUrl,
                };
            } else if (payment.cd === "ID_OVO") {
                const mobile_number = `+62${body.mobileNumber.slice(1)}`;
                channel_properties = { mobile_number };
            } else if (payment.cd === "ID_JENIUSPAY") {
                const cashtag = body.cashtag.startsWith("$") ? body.cashtag : "$" + body.cashtag;
                channel_properties = { cashtag };
            } else {
                channel_properties = {
                    success_redirect_url: redirectUrl,
                };
            }

            charge = await xenditService.createEwalletPayment({
                reference_id: invoiceId,
                amount,
                checkout_method: "ONE_TIME_PAYMENT",
                currency: "IDR",
                channel_code: payment.cd,
                channel_properties,
                basket: [
                    {
                        reference_id: product.id,
                        name: product.name,
                        category: "ML",
                        currency: "IDR",
                        price: product.price,
                        type: "PRODUCT",
                        quantity: 1,
                    },
                ],
            });
        } else if (payment.category === PaymentsCategory.QRIS) {
            charge = await xenditService.createQRISPayment({
                reference_id: invoiceId,
                type: "DYNAMIC",
                currency: "IDR",
                amount,
                channel_code: payment.cd,
                expires_at: expiredAt.toISOString(),
            });
        } else if (payment.category === PaymentsCategory.VIRTUAL_ACCOUNT) {
            charge = await xenditService.createVAPayment({
                external_id: invoiceId,
                bank_code: payment.cd,
                name: customer.name || customer.mobileNumber,
                expiration_date: expiredAt.toISOString(),
                country: "ID",
                currency: "IDR",
                is_single_use: payment.isSingleUse,
                is_closed: true,
                expected_amount: amount,
            });
        } else if (payment.category === PaymentsCategory.RETAIL) {
            charge = await xenditService.createRetailPayment({
                external_id: invoiceId,
                retail_outlet_name: payment.cd,
                name: customer.name || customer.mobileNumber,
                expected_amount: amount,
                expiration_date: expiredAt.toISOString(),
                is_single_use: payment.isSingleUse,
            });
        } else {
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.FAILED,
                },
            });

            await invoiceService.updateBy({
                by: "id",
                value: invoiceId,
                data: {
                    status: InvoiceStatuses.FAILED,
                },
            });
            throw new BusinessError(
                "Ada kesalahan di category pembayaran, silahkan coba beberapa saat lagi",
                ErrorType.Internal,
            );
        }

        if (charge.error_code) {
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.FAILED,
                },
            });

            await invoiceService.updateBy({
                by: "id",
                value: invoiceId,
                data: {
                    status: InvoiceStatuses.FAILED,
                },
            });
            throw new BusinessError(
                "Sepertinya ada kesalahan dalam pembayaran, silahkan coba beberapa saat lagi",
                ErrorType.Internal,
            );
        }

        await invoiceService.updateBy({
            by: "id",
            value: invoiceId,
            data: {
                xenditId: charge.id,
            },
        });
    }

    io.emit("order:new", {
        id: order.id,
        invoiceId: invoiceId,
        customerId: order.customerId,
        paymentMethodId: order.paymentMethodId,
        game: order.game,
        productName: order.productName,
        paymentMethod: order.paymentMethod,
        totalAmt: order.totalAmt,
        feeAmt: order.feeAmt,
        discAmt: order.discAmt,
        promoCd: order.promoCd,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        completedAt: order.completedAt,
        productId: product.id,
        amount: orderDetail.amount,
        quantity: orderDetail.quantity,
        logoUrl: game.logoUrl,
        mobileNumber: customer.mobileNumber,
    });

    const whatsappTemplateService = new WhatsappTemplateService();
    const template = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "order_pending",
    });

    client.sendNotifyOrder({
        targetNumber: customer.mobileNumber,
        message: template,
        isTest: false,
        data: {
            invoiceId,
            link: `${config.feUrl}/payment/${invoiceId}`,
            quantity: body.quantity,
            mobileNumber: customer.mobileNumber,
            amount: product.price,
            game: order.game,
            productName: order.productName,
            paymentMethod: order.paymentMethod,
            feeAmt: fee,
            totalAmt: amount,
            discAmt: order.discAmt,
        },
    });
    return res.send({
        invoice: invoiceId,
        expiredAt,
    });
};

export const postOrderV2: IApiRouter = {
    path,
    method,
    main,
    auth,
};
