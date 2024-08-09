import { RequestHandler } from "express";
import { GameService, OrderService, PaymentMethodService, ProductService } from "@serviceInternal/index";
import { Config } from "@config/index";
import {
    APIAuth,
    APIMethod,
    DigiflazzOrderStatuses,
    InvoiceStatuses,
    OrderStatuses,
    OrderType,
    ResponseCodeDigiflazzOrder,
    ServerIdType,
    ValidatorType,
} from "@enum/index";
import { v4 as uuid } from "uuid";
import { Validation, IApiRouter } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import dayjs from "dayjs";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { GameEntity, OrderDetailEntity, OrderEntity, ProductEntity } from "@entity/index";
import APIGamesService from "@serviceExternal/apiGames.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";

const path = "/v1/digiflazz/order";
const method = APIMethod.POST;
const auth = APIAuth.DIGIFLAZZ_SELLER;

export function getStatus(order: OrderEntity) {
    const SUCCESS = [OrderStatuses.SUCCESS];
    const PENDING = [OrderStatuses.PENDING_ORDER, OrderStatuses.PENDING_PAYMENT, OrderStatuses.PROCESSING];
    const FAILED = [OrderStatuses.FAILED];

    if (SUCCESS.includes(order.status)) {
        return DigiflazzOrderStatuses.SUCCESS;
    } else if (PENDING.includes(order.status)) {
        return DigiflazzOrderStatuses.PENDING;
    } else {
        return DigiflazzOrderStatuses.FAILED;
    }
}

export function getSn(order: OrderEntity) {
    if (order.orderDetail.product.game.type === "voucher") {
        const voucher: string[] = JSON.parse(order.orderDetail.gameVoucher) || [];
        return voucher.join(",");
    } else {
        return order.invoiceId;
    }
}

const schemaValidation: Validation[] = [
    {
        name: "username",
        type: "string",
        required: true,
    },
    {
        name: "commands",
        type: "string",
        required: true,
    },
    {
        name: "ref_id",
        type: "string",
        required: true,
    },
    {
        name: "hp",
        type: "string",
        required: true,
    },
    {
        name: "pulsa_code",
        type: "string",
        required: true,
    },
    {
        name: "sign",
        type: "string",
        required: true,
    },
];
const main: RequestHandler = async (req, res) => {
    const ip = req.ip;
    const body = new Validator(req, res).process<{
        username: string;
        commands: string;
        ref_id: string;
        hp: string;
        pulsa_code: string;
        sign: string;
    }>(schemaValidation, ValidatorType.BODY);
    const io = req.io;

    const orderService = new OrderService();
    const order = await orderService.model.findOne({
        where: {
            extTrxId: body.ref_id,
        },
        include: [
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
    });

    if (order) {
        res.send({
            data: {
                ref_id: order.extTrxId,
                status: getStatus(order),
                code: order.orderDetail.product.code,
                hp: order.orderDetail.userId + (order.orderDetail.serverId || "") || "",
                price: order.totalAmt,
                message: order.remark,
                balance: "0",
                tr_id: order.id,
                rc: "00",
                sn: getSn(order),
            },
        });

        return;
    }

    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "code",
        value: body.pulsa_code,
    });

    if (!product) {
        res.send({
            data: {
                ref_id: body.ref_id,
                status: DigiflazzOrderStatuses.FAILED,
                code: body.pulsa_code,
                hp: body.hp,
                price: "0",
                message: "Kode Produk tidak valid",
                balance: "0",
                tr_id: "0",
                rc: ResponseCodeDigiflazzOrder.CODE_NOT_FOUND,
                sn: "0",
            },
        });
        return;
    }

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: "id",
        value: product.gameId,
    });

    if (game.type === "voucher" && game.voucherType === "internal") {
        const gameVoucherService = new GameVoucherService();
        const gameVoucher = await gameVoucherService.model.count({
            where: {
                productId: product.id,
                used: false,
            },
        });

        if (gameVoucher <= 0) {
            res.send({
                data: {
                    ref_id: body.ref_id,
                    status: DigiflazzOrderStatuses.FAILED,
                    code: body.pulsa_code,
                    hp: body.hp,
                    price: "0",
                    message: "Out of stock",
                    balance: "0",
                    tr_id: "0",
                    rc: ResponseCodeDigiflazzOrder.FAILED,
                    sn: "0",
                },
            });
            return;
        }
    }

    const splitterId = body.hp.split("_");
    const userId = splitterId[0];
    let serverId = splitterId[1] || "";

    const gamesNeedClearSeverId = ["mobilelegends", "ML"];
    if (gamesNeedClearSeverId.includes(game.cd)) {
        serverId = serverId.replace(/[^0-9]/g, "");
    }

    let serverName = serverId;
    if (game.typeServerId === ServerIdType.LIST) {
        const serverIdService = new ListServerService();
        const SID = await serverIdService.findOneBy({
            column: "value",
            value: serverId,
        });

        if (SID) {
            serverName = SID.label;
        }
    }

    const paymentMethodService = new PaymentMethodService();
    const payment = await paymentMethodService.model.findOne({
        where: {
            cd: "GASSKEUN",
        },
    });

    const expiredAt = dayjs().tz("Asia/Jakarta").add(payment.durationExpired, payment.durationCd).toDate();
    const invoiceId = `INV${new Date().getTime()}`;
    const invoiceService = new InvoiceService();
    await invoiceService.create({
        id: invoiceId,
        status: InvoiceStatuses.PENDING,
        expiredAt,
    });

    const sysConfigService = new SysConfigService();
    const configApiGames = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_games_merchant_id", "api_games_secret_key", "percentage_digiflazz"],
        operator: "in",
    });

    const customerId = "9ab547e7-3aef-4f9a-b073-6c6806389d85";
    const percentageDigiflazzPrice = configApiGames.find((item) => item.cd === "percentage_digiflazz").value;
    const amount = Math.ceil(
        product.digiflazzPrice || product.price - Math.ceil(product.price * parseFloat(percentageDigiflazzPrice)) / 100,
    );
    const newOrder = await orderService.create({
        id: uuid(),
        promoId: null,
        customerId,
        invoiceId,
        paymentMethodId: payment.id,
        totalAmt: amount,
        feeAmt: 0,
        discAmt: 0,
        status: OrderStatuses.PROCESSING,
        promoCd: null,
        game: game.name,
        productName: product.name,
        paymentMethod: payment.name,
        amtBuy: Math.ceil(product.priceBuy),
        type: OrderType.TOPUP,
        ipAddress: null,
        isNew: false,
        isSellerDigiflazz: true,
    });

    let checkUsername;
    const orderDetailService = new OrderDetailService();
    const newOrderDetail = await orderDetailService.create({
        id: uuid(),
        orderId: order.id,
        productId: product.id,
        userId: userId || "",
        serverId: serverName || "",
        amount: product.price,
        quantity: 1,
        webhookCount: 0,
        username: checkUsername?.data?.username || null,
    });

    if (game.needCheckId) {
        const merchantId = configApiGames.find((item) => item.cd === "api_games_merchant_id");
        const secretKey = configApiGames.find((item) => item.cd === "api_games_secret_key");
        const apiGameService = new APIGamesService({
            merchantId: merchantId.value,
            secretKey: secretKey.value,
        });

        checkUsername = await apiGameService.checkUsernameGame({
            gameCode: game.cd,
            userId: userId + (serverId || ""),
        });

        if (checkUsername.status === 0) {
            res.send({
                data: {
                    ref_id: body.ref_id,
                    status: DigiflazzOrderStatuses.FAILED,
                    code: body.pulsa_code,
                    hp: body.hp,
                    price: newOrder.totalAmt,
                    message: "User ID or Server ID is not valid",
                    balance: "0",
                    tr_id: order.id,
                    rc: ResponseCodeDigiflazzOrder.INCORRECT_DESTINATION_NUMBER,
                    sn: order.invoiceId,
                },
            });
            return;
        }

        if (!checkUsername?.data?.is_valid || checkUsername.error_msg === "Wrong Player ID") {
            res.send({
                data: {
                    ref_id: body.ref_id,
                    status: DigiflazzOrderStatuses.FAILED,
                    code: body.pulsa_code,
                    hp: body.hp,
                    price: newOrder.totalAmt,
                    message: "User ID or Server ID is not valid",
                    balance: "0",
                    tr_id: order.id,
                    rc: ResponseCodeDigiflazzOrder.INCORRECT_DESTINATION_NUMBER,
                    sn: order.invoiceId,
                },
            });
            return;
        } else if (!checkUsername.data.username) {
            res.send({
                data: {
                    ref_id: body.ref_id,
                    status: DigiflazzOrderStatuses.FAILED,
                    code: body.pulsa_code,
                    hp: body.hp,
                    price: newOrder.totalAmt,
                    message: "User ID or Server ID is not valid",
                    balance: "0",
                    tr_id: order.id,
                    rc: ResponseCodeDigiflazzOrder.INCORRECT_DESTINATION_NUMBER,
                    sn: order.invoiceId,
                },
            });
            return;
        }
    }

    const config = new Config();
    await fetch(`http://localhost:${config.port}/api/v1/gasskeun/process-order-success`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-gasskeun-key": config.xApiKeyProcessOrder,
        },
        body: JSON.stringify({
            customerId,
            orderId: order.id,
            invoiceId,
        }),
    });

    io.emit("order:new", {
        id: newOrder.id,
        invoiceId: invoiceId,
        customerId: newOrder.customerId,
        paymentMethodId: newOrder.paymentMethodId,
        game: newOrder.game,
        productName: newOrder.productName,
        paymentMethod: newOrder.paymentMethod,
        totalAmt: newOrder.totalAmt,
        feeAmt: newOrder.feeAmt,
        discAmt: newOrder.discAmt,
        promoCd: newOrder.promoCd,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
        updatedAt: newOrder.updatedAt,
        completedAt: newOrder.completedAt,
        productId: product.id,
        amount: newOrderDetail.amount,
        quantity: newOrderDetail.quantity,
        logoUrl: game.logoUrl,
        mobileNumber: "089123456789",
    });

    res.send({
        data: {
            ref_id: body.ref_id,
            status: DigiflazzOrderStatuses.PENDING,
            code: body.pulsa_code,
            hp: body.hp,
            price: newOrder.totalAmt,
            message: "Processing",
            balance: "0",
            tr_id: order.id,
            rc: ResponseCodeDigiflazzOrder.PROCESS,
            sn: order.invoiceId,
        },
    });
    return;
};

export const postOrderDigiflazzSeller: IApiRouter = {
    path,
    method,
    main,
    auth,
};
