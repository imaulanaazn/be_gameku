import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import {
  ErrorType,
  InvoiceStatuses,
  OrderStatuses,
  OrderType,
  PaymentsCategory,
  ValidatorType,
} from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
// import { XenditService } from "@serviceExternal/xendit.service";
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
// import { TokopayService } from "@serviceExternal/tokopay.service";
import { APIAuth, APIMethod } from "@enum/index";
import { MidtransService } from "@serviceExternal/midtrans.service";
import { RedisService } from "@serviceExternal/redis.service";

const path = "/v2/order-detail/:invoice";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
            [Op.in]: [OrderType.TOPUP, null, OrderType.BUY],
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
            // where: {
            //     providerCd: {
            //         [Op.notIn]: ["INTERNAL"],
            //     },
            // },
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
                required: false,
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
    value: ["api_key", "tokopay_merchant_id", "tokopay_secret_key", "logo"],
    operator: "in",
  });
  const logo = sysConfig.find((item) => item.cd === "logo");

  let paymentData = {
    mobileNumber: undefined,
    checkoutUrl: undefined,
    qrString: undefined,
    paymentCode: undefined,
  };

  if (invoice.order.status === OrderStatuses.PENDING_PAYMENT) {
    // if (invoice.order.payment.providerCd === "XENDIT") {
    //   const xenditSecretKey = sysConfig.find((item) => item.cd === "api_key");
    //   const xenditService = new XenditService(xenditSecretKey.value);
    //   const xendit = await xenditService.getPayment({
    //     category: invoice.order.payment.category as PaymentsCategory,
    //     id: invoice.xenditId,
    //   });
    //   if (invoice.order.payment.category === PaymentsCategory.EWALLET) {
    //     if (invoice.order.payment.cd === "ID_OVO") {
    //       paymentData.mobileNumber = xendit.channel_properties.mobile_number;
    //     } else if (invoice.order.payment.cd === "ID_JENIUSPAY") {
    //       paymentData.mobileNumber = xendit.channel_properties.cashtag;
    //     } else {
    //       paymentData.checkoutUrl =
    //         xendit.actions.mobile_deeplink_checkout_url ||
    //         xendit.actions.mobile_web_checkout_url ||
    //         xendit.actions.desktop_web_checkout_url;
    //       paymentData.qrString = xendit.actions.qr_checkout_string;
    //     }
    //   } else if (
    //     invoice.order.payment.category === PaymentsCategory.VIRTUAL_ACCOUNT ||
    //     invoice.order.payment.category === PaymentsCategory.RETAIL
    //   ) {
    //     paymentData.paymentCode = xendit.account_number || xendit.payment_code;
    //   } else if (invoice.order.payment.category === PaymentsCategory.QRIS) {
    //     paymentData.qrString = xendit.qr_string;
    //   } else {
    //     throw new BusinessError(
    //       "Payment Category is not valid",
    //       ErrorType.Internal
    //     );
    //   }
    // } else
    // if (invoice.order.payment.providerCd === "TOKOPAY") {
    //   const tokopayMerchantID = sysConfig.find(
    //     (item) => item.cd === "tokopay_merchant_id"
    //   );
    //   const tokopaySecretKey = sysConfig.find(
    //     (item) => item.cd === "tokopay_secret_key"
    //   );
    //   const tokopayService = new TokopayService({
    //     merchantID: tokopayMerchantID.value,
    //     secretKey: tokopaySecretKey.value,
    //   });

    //   const order = await tokopayService.getInvoice({
    //     invoiceId: invoice.id,
    //     paymentCode: invoice.order.payment.cd,
    //     totalAmt: invoice.order.totalAmt,
    //   });

    //   console.log(order);

    //   if (invoice.order.payment.category === PaymentsCategory.PULSA) {
    //     paymentData.checkoutUrl = order.data.checkout_url;
    //   } else if (invoice.order.payment.category === PaymentsCategory.RETAIL) {
    //     paymentData.paymentCode = order.data.nomor_va;
    //   } else if (
    //     invoice.order.payment.category === PaymentsCategory.VIRTUAL_ACCOUNT
    //   ) {
    //     paymentData.paymentCode = order.data.nomor_va;
    //   } else if (invoice.order.payment.category === PaymentsCategory.QRIS) {
    //     paymentData.qrString = order.data.qr_string;
    //   } else if (invoice.order.payment.category === PaymentsCategory.EWALLET) {
    //     paymentData.checkoutUrl = order.data.checkout_url;
    //   }
    // } else
    if (invoice.order.payment.providerCd === "MIDTRANS") {
      const midtransService = new MidtransService();
      let trx;
      const dataFromRedis = ["qris", "shopeepay", "gopay"];
      if (!dataFromRedis.includes(invoice.order.payment.cd)) {
        trx = await midtransService.getTransactionStatus(invoice.id);
      }

      const paymentCode = [
        "bca",
        "bni",
        "bri",
        "cimb",
        "permata",
        "indomaret",
        "alfamart",
      ];
      const ewalletGroup = ["shopeepay", "gopay"];
      if (paymentCode.includes(invoice.order.payment.cd)) {
        paymentData.paymentCode =
          trx?.payment_code ||
          trx?.permata_va_number ||
          trx.va_numbers[0]?.va_number ||
          "";
      } else if (invoice.order.payment.cd === "mandiri") {
        paymentData.paymentCode = `${trx?.biller_code || ""} ${
          trx?.bill_key || ""
        }`;
      } else if (invoice.order.payment.cd === "qris") {
        const redisService = new RedisService();
        const data = await redisService.get(`qr:payment:${invoice.id}`);
        paymentData.qrString = data || "";
      } else if (ewalletGroup.includes(invoice.order.payment.cd)) {
        const redisService = new RedisService();
        const data = await redisService.get(`qr:payment:${invoice.id}`);
        paymentData.checkoutUrl = data || "";
      }
    } else if (invoice.order.payment.providerCd === "MANUAL") {
      const sysConfigService = new SysConfigService();
      const paymentAddress = await sysConfigService.findManyBy({
        column: "cd",
        value: [
          "bca_va",
          "bni_va",
          "bri_va",
          "cimb_va",
          "permata_va",
          "maybank_va",
          "danamon_va",
          "btn_va",
          "digibank_va",
          "bsi_va",
          "mandiri_va",
          "seabank_va",
          "qris_url",
          "shopeepay_url",
          "gopay_url",
          "dana_url",
        ],
        operator: "in",
      });
      const paymentCode = [
        "bca",
        "bni",
        "bri",
        "cimb",
        "permata",
        "maybank",
        "danamon",
        "btn",
        "digibank",
        "bsi",
        "mandiri",
        "seabank",
        // "indomaret",
        // "alfamart",
      ];
      const ewalletGroup = ["shopeepay", "gopay", "dana"];

      if (paymentCode.includes(invoice.order.payment.cd)) {
        const vaNumber = paymentAddress.find((item) =>
          item.cd.includes(invoice.order.payment.cd)
        );
        paymentData.paymentCode = vaNumber.value;
      } else if (invoice.order.payment.cd === "mandiri") {
        const vaNumber = paymentAddress.find(
          (item) => item.cd === "mandiri_va"
        );
        paymentData.paymentCode = vaNumber.value;
      } else if (invoice.order.payment.cd === "qris") {
        const checkoutUrl = paymentAddress.find(
          (item) => item.cd === "qris_url"
        );
        paymentData.qrString = checkoutUrl.value || "";
      } else if (ewalletGroup.includes(invoice.order.payment.cd)) {
        const checkoutUrl = paymentAddress.find((item) =>
          item.cd.includes(invoice.order.payment.cd)
        );
        paymentData.checkoutUrl = checkoutUrl.value || "";
      }
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
        dayjs(invoice.expiredAt).isBefore(dayjs()) &&
        invoice.status === InvoiceStatuses.PENDING
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
      expiredAt: invoice.expiredAt,
    },
    product: {
      name: invoice.order.orderDetail?.product?.name || "Topup Gasskeun Coin",
      logoDenom:
        invoice.order.orderDetail?.product?.logoDenom ||
        invoice.order.orderDetail?.product?.game?.logoDenom ||
        invoice.order.orderDetail?.product?.game?.logoUrl ||
        logo.value,
    },
    game: {
      name: invoice.order.orderDetail.product?.game?.name || "Gasskeun Coin",
      logoUrl: invoice.order.orderDetail.product?.game?.logoUrl || logo.value,
    },
  });
};

export const getOrderDetailV2: IApiRouter = {
  path,
  method,
  main,
  auth,
};
