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

const path = "/v1/order-detail/:invoice";
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
    throw new BusinessError("API version v1 is no longer supported. Please use v2", ErrorType.BadRequest);
    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.findOneBy({
        column: "id",
        value: param.invoice,
    });

    if (!invoice) {
        throw new BusinessError("Nomor Invoice Tidak Valid", ErrorType.NotFound);
    }

    const orderService = new OrderService();
    const order = await orderService.model.findOne({
        where: {
            invoiceId: invoice.id,
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
    });

    const orderReviewService = new OrderReviewService();
    const orderReview = await orderReviewService.findOneBy({
        column: "orderId",
        value: order.id,
    });

    const paymentMethodService = new PaymentMethodService();
    const paymentMethod = await paymentMethodService.findOneBy({
        column: "id",
        value: order.paymentMethodId,
        only: ["category", "logo", "cd", "name"],
    });

    const orderDetailService = new OrderDetailService();
    const orderDetail = await orderDetailService.findOneBy({
        column: "orderId",
        value: order.id,
    });

    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "id",
        value: orderDetail.productId,
        only: ["gameId"],
    });

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: product.gameId,
        only: ["logoUrl"],
    });

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findOneBy({
        column: "cd",
        value: "api_key",
    });

    const xenditService = new XenditService(sysConfig.value);
    const xendit = await xenditService.getPayment({
        category: paymentMethod.category as PaymentsCategory,
        id: invoice.xenditId,
    });

    let xenditData;

    if (paymentMethod.category === PaymentsCategory.EWALLET) {
        if (paymentMethod.cd === "ID_OVO") {
            xenditData = {
                mobileNumber: xendit.channel_properties.mobile_number,
            };
        } else if (paymentMethod.cd === "ID_JENIUSPAY") {
            xenditData = {
                mobileNumber: xendit.channel_properties.cashtag,
            };
        } else {
            xenditData = {
                desktopWebCheckoutUrl: xendit.actions.desktop_web_checkout_url,
                mobileWebCheckoutUrl: xendit.actions.mobile_web_checkout_url,
                mobileDeeplinkCheckoutUrl: xendit.actions.mobile_deeplink_checkout_url,
                qrCheckoutString: xendit.actions.qr_checkout_string,
            };
        }
    } else if (paymentMethod.category === PaymentsCategory.VIRTUAL_ACCOUNT) {
        xenditData = {
            accountNumber: xendit.account_number,
            bankCode: xendit.bank_code,
            merchantCode: xendit.merchant_code,
            name: xendit.name,
        };
    } else if (paymentMethod.category === PaymentsCategory.QRIS) {
        xenditData = {
            qrString: xendit.qr_string,
        };
    } else if (paymentMethod.category === PaymentsCategory.RETAIL) {
        xenditData = {
            prefix: xendit.prefix,
            name: xendit.name,
            paymentCode: xendit.payment_code,
        };
    } else {
        throw new BusinessError("Payment Category is not valid", ErrorType.Internal);
    }

    res.send({
        ...order.dataValues,
        amt: orderDetail.amount,
        quantity: orderDetail.quantity,
        logoGame: game.logoUrl,
        logoPaymentMethod: paymentMethod.logo,
        payment: xenditData,
        status:
            dayjs(invoice.expiredAt).isBefore(dayjs()) && invoice.status === InvoiceStatuses.PENDING
                ? OrderStatuses.EXPIRED
                : order.status,
        expiredAt: dayjs(invoice.expiredAt),
        category: paymentMethod.category,
        createdAt: order.createdAt,
        cd: paymentMethod.cd,
        paymentMethods: paymentMethod,
        detail: orderDetail,
        review: orderReview
            ? {
                  reviewId: orderReview.id,
                  message: orderReview.message,
                  rating: orderReview.rating,
                  createdAt: orderReview.createdAt,
              }
            : null,
    });
};

export const getOrderDetail: IApiRouter = {
    path,
    method,
    main,
    auth,
};
