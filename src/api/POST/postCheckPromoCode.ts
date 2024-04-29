import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { DiscountType, ErrorType, OrderStatuses, ValidatorType } from "@enum/index";
import { PromotionService } from "@serviceInternal/promotion.service";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { Op } from "sequelize";
import { OrderService } from "@serviceInternal/order.service";
import { OrderEntity } from "@entity/order.entity";
import { CustomerService } from "@serviceInternal/customer.service";

const path = "/v1/check-promotion";
const method = "POST";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "promoCode",
        type: "string",
        required: true,
        errorMessage: "Kode Promo Harus Diisi",
    },
    {
        name: "productId",
        type: "string",
        required: true,
        errorMessage: "Pilih Denom Terlebih dahulu",
    },
    {
        name: "quantity",
        type: "number",
        required: true,
        errorMessage: "Jumlah Pembelian Harus Diisi",
    },
    {
        name: "gameId",
        type: "string",
        required: true,
    },
    {
        name: "mobileNumber",
        type: "string",
        required: true,
        isMobileNo: true,
    },
    {
        name: "customerId",
        type: "string",
        required: false,
    },
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
];

const main: RequestHandler = async (req, res) => {
    const ip = req.ip;
    const body = new Validator(req, res).process<{
        promoCode: string;
        productId: string;
        gameId?: string;
        quantity: number;
        mobileNumber: string;
        customerId?: string;
        userId?: string;
        serverId?: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    console.log(req.headers["x-forwarded-for"]);
    if (body.userId || body.serverId) {
        const orderDetailService = new OrderDetailService();
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
                        promoCd: body.promoCode,
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

    const customerService = new CustomerService();
    const orderSevice = new OrderService();

    let customerId = [];
    const customer = await customerService.findOneBy({
        column: "mobileNumber",
        value: body.mobileNumber,
    });

    if (customer) {
        customerId.push(customer.id);
    }

    if (body.customerId) {
        customerId.push(body.customerId);
    }
    const order = await orderSevice.model.findAll({
        where: {
            customerId: {
                [Op.in]: customerId,
            },
            promoCd: body.promoCode,
            status: {
                [Op.in]: [OrderStatuses.PENDING_ORDER, OrderStatuses.SUCCESS, OrderStatuses.PENDING_PAYMENT],
            },
        },
    });

    if (order.length > 0) {
        throw new BusinessError("Kode promo pernah sudah digunakan", ErrorType.BadRequest);
    }

    const promotionService = new PromotionService();
    const promoCode = await promotionService.findAvailablePromoBypromoCode(body.promoCode);
    if (!promoCode) {
        throw new BusinessError("Kode Promo tidak valid atau kadaluarsa", ErrorType.BadRequest);
    }

    const usedVoucher = await orderSevice.model.count({
        where: {
            promoCd: body.promoCode,
        },
    });

    if (usedVoucher > promoCode.stock) {
        throw new BusinessError("Kode promo telah habis", ErrorType.BadRequest);
    }

    if (promoCode.gameId && !body.gameId) {
        throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
    }

    if (promoCode.gameId && promoCode.gameId !== body.gameId) {
        throw new BusinessError("Kode Promo tidak valid untuk game ini", ErrorType.BadRequest);
    }

    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "id",
        value: body.productId,
    });

    if (product.gameId !== body.gameId) {
        throw new BusinessError("Product Tidak valid", ErrorType.BadRequest);
    }

    if (!product) {
        throw new BusinessError("Product tidak ditemukan", ErrorType.NotFound);
    }

    const totalPrice = body.quantity * product.price;
    if (totalPrice < promoCode.minPurchase) {
        throw new BusinessError("Kode Promo yang dimasukkan tidak memenuhi minimal pembelian", ErrorType.BadRequest);
    }

    let totalDiscount = 0;
    if (promoCode.discountType === DiscountType.PERCENTAGE) {
        const disc = Math.ceil((promoCode.discountValue / 100) * totalPrice);
        totalDiscount = disc > promoCode.maxDiscount ? promoCode.maxDiscount : disc;
    } else {
        totalDiscount = promoCode.discountValue;
    }

    const priceAfterDiscount = totalPrice - totalDiscount;
    res.send({
        priceBeforeDiscount: totalPrice,
        priceAfterDiscount,
        discount: totalDiscount,
    });
};

export const postCheckPromoCode: IApiRouter = {
    path,
    method,
    main,
    auth,
};
