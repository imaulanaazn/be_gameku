import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { DiscountType, ErrorType, ValidatorType } from "@enum/index";
import { PromotionService } from "@serviceInternal/promotion.service";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";

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
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        promoCode: string;
        productId: string;
        gameId?: string;
        quantity: number;
    }>(schemaValidation, ValidatorType.BODY);

    const promotionService = new PromotionService();
    const promoCode = await promotionService.findAvailablePromoBypromoCode(body.promoCode);
    if (!promoCode) {
        throw new BusinessError("Kode Promo tidak valid atau kadaluarsa", ErrorType.BadRequest);
    }

    if (promoCode.gameId && !body.gameId) {
        throw new BusinessError("Kode Promo tidak valid untuk game ini 1", ErrorType.BadRequest);
    }

    if (promoCode.gameId && promoCode.gameId !== body.gameId) {
        throw new BusinessError("Kode Promo tidak valid untuk game ini 2", ErrorType.BadRequest);
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
        throw new BusinessError("Kode Promo yang dimasukkan idak memenuhi minimal pembelian", ErrorType.BadRequest);
    }

    let totalDiscount = 0;
    if (promoCode.discountType === DiscountType.PERCENTAGE) {
        totalDiscount = (promoCode.discountValue / 100) * totalPrice;
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
