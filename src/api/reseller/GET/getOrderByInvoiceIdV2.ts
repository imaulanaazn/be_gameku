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
import { GameEntity } from "@entity/game.entity";
import { OrderEntity } from "@entity/order.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { OrderReviewEntity } from "@entity/orderReview.entity";
import { PaymentMethodEntity } from "@entity/paymentMethod.entity";
import { ProductEntity } from "@entity/product.entity";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v2/reseller/order-detail/:invoice";
const method = APIMethod.GET;
const auth = APIAuth.RESELLER;

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

    const session = req.reseller.data;
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
                    customerId: session.id,
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
                                [Op.in]: ["INTERNAL"],
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
        throw new BusinessError("Invoice Id tidak valid", ErrorType.BadRequest);
    }

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["logo", "rekening_name", "rekening_number"],
        operator: "in",
    });
    const logo = sysConfig.find((item) => item.cd === "logo");
    const rekeningName = sysConfig.find((item) => item.cd === "rekening_name");
    const rekeningNumber = sysConfig.find((item) => item.cd === "rekening_number");

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
            ...(invoice.order.payment.cd === "GASSKEUN_DEPOSIT"
                ? { action: { paymentCode: rekeningNumber.value, name: rekeningName.value } }
                : {}),
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

export const getOrderDetailResellerV2: IApiRouter = {
    path,
    method,
    main,
    auth,
};
