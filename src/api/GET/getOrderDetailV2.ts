import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType, PaymentsCategory, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { XenditService } from "@serviceExternal/xendit.service";
import { OrderService } from "@serviceInternal/order.service";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { GameService } from "@serviceInternal/game.service";
import dayjs from "dayjs";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { Op } from "sequelize";
import { OrderReviewService } from "@serviceInternal/orderReview.service";
import { OrderReviewEntity } from "@entity/orderReview.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { ProductEntity } from "@entity/product.entity";
import { GameEntity } from "@entity/game.entity";
import { PaymentMethodEntity } from "@entity/paymentMethod.entity";
import { OrderEntity } from "@entity/order.entity";
import { TokopayService } from "@serviceExternal/tokopay.service";

const path = "/v2/order-detail/:invoice";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "invoice",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        invoice: string;
    }>(schemaValidation, ValidatorType.PARAMS);

    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.model.findOne({
        where: {
            id: param.invoice,
        },
        include: [
            {
                model: OrderEntity,
                required: true,
                where: {
                    type: {
                        [Op.in]: [OrderType.TOPUP, null],
                    },
                },
                attributes: [
                    "id",
                    "invoiceId",
                    "game",
                    "paymentMethod",
                    "paymentMethodId",
                    "productName",
                    "totalAmt",
                    "feeAmt",
                    "discAmt",
                    "promoCd",
                    "status",
                    "createdAt",
                ],
                include: [
                    {
                        model: PaymentMethodEntity,
                        required: true,
                        where: {
                            providerCd: {
                                [Op.notIn]: ["INTERNAL"],
                            },
                        },
                    },
                    {
                        model: OrderReviewEntity,
                        required: false,
                        attributes: [["id", "reviewId"], "message", "rating", "createdAt"],
                    },
                    {
                        model: OrderDetailEntity,
                        required: true,
                        include: [
                            {
                                model: ProductEntity,
                                required: true,
                                include: [
                                    {
                                        model: GameEntity,
                                        required: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!invoice) {
        throw new BusinessError("Nomor Invoice Tidak Valid", ErrorType.NotFound);
    }

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_key", "tokopay_merchant_id", "tokopay_secret_key"],
        operator: "in",
    });

    let paymentData = {
        mobileNumber: undefined,
        checkoutUrl: undefined,
        qrString: undefined,
        paymentCode: undefined,
    };

    if (invoice.order.payment.providerCd === "XENDIT") {
        const xenditSecretKey = sysConfig.find((item) => item.cd === "api_key");
        const xenditService = new XenditService(xenditSecretKey.value);
        const xendit = await xenditService.getPayment({
            category: invoice.order.payment.category as PaymentsCategory,
            id: invoice.xenditId,
        });
        if (invoice.order.payment.category === PaymentsCategory.EWALLET) {
            if (invoice.order.payment.cd === "ID_OVO") {
                paymentData.mobileNumber = xendit.channel_properties.mobile_number;
            } else if (invoice.order.payment.cd === "ID_JENIUSPAY") {
                paymentData.mobileNumber = xendit.channel_properties.cashtag;
            } else {
                paymentData.checkoutUrl =
                    xendit.actions.mobile_deeplink_checkout_url ||
                    xendit.actions.mobile_web_checkout_url ||
                    xendit.actions.desktop_web_checkout_url;
                paymentData.qrString = xendit.actions.qr_checkout_string;
            }
        } else if (
            invoice.order.payment.category === PaymentsCategory.VIRTUAL_ACCOUNT ||
            invoice.order.payment.category === PaymentsCategory.RETAIL
        ) {
            paymentData.paymentCode = xendit.account_number || xendit.payment_code;
        } else if (invoice.order.payment.category === PaymentsCategory.QRIS) {
            paymentData.qrString = xendit.qr_string;
        } else {
            throw new BusinessError("Payment Category is not valid", ErrorType.Internal);
        }
    } else if (invoice.order.payment.providerCd === "TOKOPAY") {
        const tokopayMerchantID = sysConfig.find((item) => item.cd === "tokopay_merchant_id");
        const tokopaySecretKey = sysConfig.find((item) => item.cd === "tokopay_secret_key");
        const tokopayService = new TokopayService({
            merchantID: tokopayMerchantID.value,
            secretKey: tokopaySecretKey.value,
        });

        const order = await tokopayService.getInvoice({
            invoiceId: invoice.id,
            paymentCode: invoice.order.payment.cd,
            totalAmt: invoice.order.totalAmt,
        });

        if (invoice.order.payment.category === PaymentsCategory.PULSA) {
            paymentData.checkoutUrl = order.data.checkout_url;
        } else if (invoice.order.payment.category === PaymentsCategory.RETAIL) {
            paymentData.paymentCode = order.data.nomor_va;
        } else if (invoice.order.payment.category === PaymentsCategory.VIRTUAL_ACCOUNT) {
            paymentData.paymentCode = order.data.nomor_va;
        } else if (invoice.order.payment.category === PaymentsCategory.QRIS) {
            paymentData.qrString = order.data.qr_string;
        } else if (invoice.order.payment.category === PaymentsCategory.EWALLET) {
            paymentData.checkoutUrl = order.data.checkout_url;
        }
    }

    res.send({
        order: {
            invoiceId: invoice.id,
            totalAmt: invoice.order.totalAmt,
            feeAmt: invoice.order.feeAmt,
            discAmt: invoice.order.discAmt,
            promoCd: invoice.order.promoCd,
            status:
                dayjs(invoice.expiredAt).isBefore(dayjs()) && invoice.status === InvoiceStatuses.PENDING
                    ? OrderStatuses.EXPIRED
                    : invoice.order.status,
            userId: invoice.order.orderDetail.userId,
            serverId: invoice.order.orderDetail.serverId,
            amount: invoice.order.orderDetail.amount,
            quantity: invoice.order.orderDetail.quantity,
            username: invoice.order.orderDetail.username,
            createdAt: invoice.order.createdAt,
            completedAt: invoice.order.completedAt,
        },
        payment: {
            name: invoice.order.payment.name,
            cd: invoice.order.payment.cd,
            logo: invoice.order.payment.logo,
            paymentGuide: invoice.order.payment.paymentGuide,
            action: paymentData,
        },
        product: {
            name: invoice.order.orderDetail.product.name,
            logoDenom:
                invoice.order.orderDetail.product.logoDenom ||
                invoice.order.orderDetail.product.game.logoDenom ||
                invoice.order.orderDetail.product.game.logoUrl,
        },
        game: {
            name: invoice.order.orderDetail.product.game.name,
            logoUrl: invoice.order.orderDetail.product.game.logoUrl,
        },
    });
};

export const getOrderDetailV2: IApiRouter = {
    path,
    method,
    main,
    auth,
};
