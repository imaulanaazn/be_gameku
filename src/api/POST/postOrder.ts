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
import { DiscountType, ErrorType, FeeType, OrderStatuses, PaymentsCategory, ValidatorType } from "@enum/index";
import { v4 as uuid } from "uuid";
import { BusinessError } from "@helper/handleError";
import { Validation, IApiRouter } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { XenditService } from "@serviceExternal/xendit.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import dayjs from "dayjs";
import validator from "validator";

const path = "/v1/order";
const method = "POST";
const auth = "guess";

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
];
const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        userId?: string;
        serverId?: string;
        productId: string;
        quantity: number;
        paymentId: string;
        promoCode?: string;
        mobileNumber: string;
        cashtag?: string;
    }>(schemaValidation, ValidatorType.BODY);

    const voucherService = new PromotionService();
    const productService = new ProductService();
    const paymentMethodService = new PaymentMethodService();
    const xenditService = new XenditService();
    const orderService = new OrderService();
    const customerService = new CustomerService();
    const invoiceService = new InvoiceService();
    const orderDetailService = new OrderDetailService();
    const gameService = new GameService();
    const config = new Config();

    // let customer: CustomerEntity;
    // if (body.customerId) {
    //     customer = await customerService.findOneBy({
    //         column: "id",
    //         value: body.customerId,
    //     });
    //     if (!customer) {
    //         throw new BusinessError(`Customer dengan id ${body.customerId} tidak valid`, ErrorType.NotFound);
    //     }
    // }
    const convertedNumber = body.mobileNumber.replace(/^(\+62|62|0)?(\d+)/, "0$2");
    const check = validator.isMobilePhone(convertedNumber, "id-ID");
    if (!check) {
        throw new BusinessError("Nomor Whatsapp tidak valid", ErrorType.BadRequest);
    }

    let customer = await customerService.findOneBy({
        column: "mobileNumber",
        value: convertedNumber,
    });

    if (!customer) {
        customer = await customerService.create({
            id: uuid(),
            roleId: config.roleGuest,
            mobileNumber: convertedNumber,
            isActive: true,
            isRegistered: false,
        });
    }
    const payment = await paymentMethodService.findOneBy({
        column: "id",
        value: body.paymentId,
    });

    if (!payment) {
        throw new BusinessError("Payment ID tidak valid", ErrorType.NotFound);
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

    let discount = 0;
    if (body.promoCode) {
        const voucher = await voucherService.findAvailablePromoBypromoCode(body.promoCode);
        if (!voucher) {
            throw new BusinessError(`Kode Promo tidak valid atau kadaluarsa`, ErrorType.NotFound);
        }

        if (voucher.gameId && !product.gameId) {
            throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
        }

        if (voucher.gameId && voucher.gameId !== product.gameId) {
            throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
        }

        if (voucher && product.price >= voucher.minPurchase) {
            if (voucher.discountType === DiscountType.PERCENTAGE) {
                discount = (voucher.discountValue / 100) * product.price;
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
        fee = Math.ceil((product.price * payment.fee) / 100);
    } else {
        throw new BusinessError("Sepertinya ada kesalahan, silahkan coba beberapa saat lagi [FEE]", ErrorType.Internal);
    }

    const amount = product.price * body.quantity - discount + fee;

    if (amount < payment.minAmount || amount > payment.maxAmount) {
        throw new BusinessError(
            "Pembayaran tidak dapat diproses karena tidak memenuhi syarat jumlah pembayaran.",
            ErrorType.BadRequest,
        );
    }

    // TODOOOOOOOOOOOO
    // CHECK USERNAME GAME
    // ......
    // CHECK USERNAME GAME

    const invoiceId = `INV${new Date().getTime()}`;
    const expiredAt = dayjs().tz("Asia/Jakarta").add(payment.durationExpired, payment.durationCd).toDate();
    let charge: any;

    await invoiceService.create({
        id: invoiceId,
        status: OrderStatuses.UNPAID,
        expiredAt,
    });

    const order = await orderService.create({
        id: uuid(),
        customerId: customer.id,
        invoiceId,
        paymentMethodId: payment.id,
        totalAmt: amount,
        feeAmt: fee,
        discAmt: discount,
        status: OrderStatuses.UNPAID,
        promoCd: body.promoCode ? body.promoCode : "",
        game: game.name,
        productName: product.name,
        paymentMethod: payment.name,
    });
    console.log(body.quantity);
    await orderDetailService.create({
        id: uuid(),
        orderId: order.id,
        productId: product.id,
        userId: body.userId || "",
        serverId: body.serverId || "",
        amount: product.price,
        quantity: body.quantity,
    });

    const response: any = {
        id: order.id,
        invoiceId,
        totalAmount: amount,
        productName: product.name,
        productPrice: product.price,
        fee,
        discount,
        paymentName: payment.name,
        paymentLogo: payment.logo,
        expiredAt,
        promoCode: body.promoCode,
        mobileNumber: body.mobileNumber,
        userId: body.userId,
        serverId: body.serverId,
        isExpired: false,
        category: payment.category,
    };

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

        response.actions = charge.actions;
    } else if (payment.category === PaymentsCategory.QRIS) {
        charge = await xenditService.createQRISPayment({
            reference_id: invoiceId,
            type: "DYNAMIC",
            currency: "IDR",
            amount,
            channel_code: payment.cd,
            expires_at: expiredAt.toISOString(),
        });

        response.qrString = charge.qr_string;
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

        response.accountNumber = charge.account_number;
    } else if (payment.category === PaymentsCategory.RETAIL) {
        charge = await xenditService.createRetailPayment({
            external_id: invoiceId,
            retail_outlet_name: payment.cd,
            name: customer.name || customer.mobileNumber,
            expected_amount: amount,
            expiration_date: expiredAt.toISOString(),
            is_single_use: payment.isSingleUse,
        });

        response.paymentCode = charge.payment_code;
    } else {
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
                status: OrderStatuses.FAILED,
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

    return res.send({
        invoice: invoiceId,
        expiredAt,
    });
};

export const postOrder: IApiRouter = {
    path,
    method,
    main,
    auth,
};
