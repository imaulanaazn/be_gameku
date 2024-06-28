import {
    ErrorType,
    FeeType,
    InvoiceStatuses,
    OrderStatuses,
    OrderType,
    PaymentsCategory,
    ValidatorType,
} from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { XenditService } from "@serviceExternal/xendit.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { OrderService } from "@serviceInternal/order.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { Config } from "@config/index";
import { Op } from "sequelize";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v2/reseller/topup";
const method = APIMethod.POST;
const auth = APIAuth.RESELLER;

const schemaValidation: Validation[] = [
    {
        name: "amount",
        type: "number",
        required: true,
    },
    {
        name: "paymentMethodId",
        type: "string",
        required: true,
    },
    {
        name: "cashtag",
        type: "string",
        required: false,
    },
    {
        name: "mobileNumber",
        type: "string",
        required: false,
        isMobileNo: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        amount: number;
        paymentMethodId: string;
        cashtag: string;
        mobileNumber: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    console.log(req.headers["x-forwarded-for"]);
    const customer = req.reseller.data;
    const io = req.io;

    const paymentMethodService = new PaymentMethodService();
    const sysConfigService = new SysConfigService();
    const sysConfigs = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_key", "min_deposit"],
        operator: "in",
    });
    const xenditService = new XenditService(sysConfigs.find((item) => item.cd === "api_key").value);
    const orderService = new OrderService();
    const orderDetailService = new OrderDetailService();
    const invoiceService = new InvoiceService();

    const payment = await paymentMethodService.model.findOne({
        where: {
            id: body.paymentMethodId,
        },
    });

    if (!payment) {
        throw new BusinessError("Metode Pembayaran tidak valid", ErrorType.BadRequest);
    }

    if (payment.cd === "ID_OVO" && !body.mobileNumber) {
        throw new BusinessError("Metode Pembayaran OVO harus ada Nomor OVO", ErrorType.BadRequest);
    }

    const minDeposit = parseInt(sysConfigs.find((item) => item.cd === "min_deposit").value);
    if (body.amount < minDeposit) {
        throw new BusinessError(`Tidak memenuhi minimal deposit`, ErrorType.BadRequest);
    }

    if (body.amount < payment.minAmount || body.amount > payment.maxAmount) {
        throw new BusinessError(
            "Pembayaran tidak dapat diproses karena tidak memenuhi syarat jumlah pembayaran.",
            ErrorType.BadRequest,
        );
    }

    const invoiceId = `INV-T${new Date().getTime()}`;
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

    let fee = 0;
    if (payment.feeType === FeeType.AMOUNT) {
        fee = payment.fee;
    } else if (payment.feeType === FeeType.PERCENTAGE) {
        fee = Math.ceil((body.amount * payment.fee) / 100);
    } else {
        throw new BusinessError("Sepertinya ada kesalahan, silahkan coba beberapa saat lagi [FEE]", ErrorType.Internal);
    }

    const amount = Math.ceil(body.amount + fee);

    const order = await orderService.create({
        id: uuid(),
        promoId: null,
        customerId: customer.id,
        invoiceId,
        paymentMethodId: payment.id,
        totalAmt: amount,
        feeAmt: fee,
        discAmt: 0,
        status: OrderStatuses.PENDING_PAYMENT,
        promoCd: null,
        game: null,
        productName: null,
        paymentMethod: payment.name,
        amtBuy: 0,
        type: OrderType.BUY,
        isNew: checkingOrder <= 0,
    });

    const orderDetail = await orderDetailService.create({
        id: uuid(),
        orderId: order.id,
        productId: null,
        userId: null,
        serverId: null,
        amount: body.amount,
        quantity: 1,
        webhookCount: 0,
        username: null,
    });

    let response: any = {
        invoiceId,
        paymentMethod: payment.name,
        expiredAt,
        paymentCd: payment.cd,
        paymentCategory: payment.category,
        feeAmt: fee,
        totalAmt: amount,
        amt: body.amount,
    };

    const config = new Config();
    let charge: any;
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
        });

        response = {
            ...response,
            actions: charge.actions,
        };
    } else if (payment.category === PaymentsCategory.QRIS) {
        charge = await xenditService.createQRISPayment({
            reference_id: invoiceId,
            type: "DYNAMIC",
            currency: "IDR",
            amount,
            channel_code: payment.cd,
            expires_at: expiredAt.toISOString(),
        });

        response = {
            ...response,
            qrString: charge.qr_string,
        };
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

        response = {
            ...response,
            accountNumber: charge.account_number,
        };
    } else if (payment.category === PaymentsCategory.RETAIL) {
        charge = await xenditService.createRetailPayment({
            external_id: invoiceId,
            retail_outlet_name: payment.cd,
            name: customer.name || customer.mobileNumber,
            expected_amount: amount,
            expiration_date: expiredAt.toISOString(),
            is_single_use: payment.isSingleUse,
        });

        response = {
            ...response,
            paymentCode: charge.payment_code,
        };
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
    return res.send(response);
};

export const postTopupFundV2: IApiRouter = {
    path,
    method,
    main,
    auth,
};
