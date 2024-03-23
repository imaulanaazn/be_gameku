import { Config } from "@config/index";
import { InvoiceStatuses, OrderStatuses, OrderType, ValidatorType, VoucherType } from "@enum/index";
import { sleep } from "@helper/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import APIGamesService from "@serviceExternal/apiGames.service";
import { FundService } from "@serviceInternal/fund.service";
import { GameService } from "@serviceInternal/game.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import { OrderService } from "@serviceInternal/order.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";
import { config } from "winston";
import { v4 as uuid } from "uuid";
import { ProviderService } from "@serviceInternal/provider.service";
import { DigiflazzService } from "@serviceExternal/digiflazz.service";
import { LapakGamingService } from "@serviceExternal/lapakgaming.service";

const path = "/v1/gasskeun/process-order-success";
const method = "POST";
const auth = "webhook-internal";

const schemaValidation: Validation[] = [
    {
        name: "orderId",
        required: true,
        type: "string",
    },
    {
        name: "invoiceId",
        required: true,
        type: "string",
    },
    {
        name: "customerId",
        required: true,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const io = req.io;
    const client = req.client;
    const body = new Validator(req, res).process<{
        customerId: string;
        orderId: string;
        invoiceId: string;
    }>(schemaValidation, ValidatorType.BODY);

    const config = new Config();
    const invoiceService = new InvoiceService();
    const orderService = new OrderService();
    const sysConfigService = new SysConfigService();
    const configDb = await sysConfigService.findManyBy({
        column: "cd",
        value: [
            "api_games_merchant_id",
            "api_games_secret_key",
            "api_key_digiflazz",
            "username_digiflazz",
            "api_key_lapakgaming",
        ],
        operator: "in",
    });

    const order = await orderService.findOneBy({
        column: "id",
        value: body.orderId,
    });

    const invoice = await invoiceService.findOneBy({
        column: "id",
        value: body.invoiceId,
    });

    await invoiceService.updateBy({
        by: "id",
        value: invoice.id,
        data: {
            status: InvoiceStatuses.PAID,
        },
    });

    await orderService.updateBy({
        by: "id",
        value: order.id,
        data: {
            status: OrderStatuses.PENDING_ORDER,
        },
    });

    const orderDetailService = new OrderDetailService();
    const orderDetail = await orderDetailService.findOneBy({
        column: "orderId",
        value: order.id,
    });

    res.sendStatus(200);
    if (order.type === OrderType.TOPUP) {
        console.log("@@ Process order Topup");
        const productService = new ProductService();
        const product = await productService.findOneBy({
            column: "id",
            value: orderDetail.productId,
        });

        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: product.gameId,
        });

        const providerService = new ProviderService();
        const productProvider = await providerService.findOneBy({
            column: "id",
            value: game.provider,
        });

        console.log(productProvider?.dataValues);

        if (process.env.NODE_ENV.toLowerCase() === "development" || !process.env.NODE_ENV) {
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.SUCCESS,
                },
            });

            return;
        }

        if (product.automatically) {
            await orderService.updateBy({
                by: "id",
                value: order.id,
                data: {
                    status: OrderStatuses.PROCESSING,
                },
            });

            if (productProvider.cd === "API_GAMES") {
                const merchantId = configDb.find((item) => item.cd === "api_games_merchant_id");
                const secretKey = configDb.find((item) => item.cd === "api_games_secret_key");
                const apiGamesService = new APIGamesService({
                    merchantId: merchantId.value,
                    secretKey: secretKey.value,
                });

                console.log(
                    `@@@ GAME ORDER OTOMATIS TO API GAMES ${order.game} ${order.productName} total ${orderDetail.quantity}`,
                );
                for (let i = 0; i < orderDetail.quantity; i++) {
                    const createTrxApiGames = await apiGamesService.createTransaction({
                        invoiceId: `${order.invoiceId}_${i}`,
                        productCode: product.code,
                        userId: orderDetail.userId,
                        serverId: orderDetail.serverId || "",
                    });
                    console.log(createTrxApiGames);
                    await sleep(500);
                }
                return;
            } else if (productProvider.cd === "DIGIFLAZZ") {
                console.log(
                    `@@@ GAME ORDER OTOMATIS TO DIGIFLAZZ ${order.game} ${order.productName} total ${orderDetail.quantity}`,
                );
                const username = configDb.find((item) => item.cd === "username_digiflazz").value;
                const apiKey = configDb.find((item) => item.cd === "api_key_digiflazz").value;
                const digiflazzService = new DigiflazzService({
                    apiKey,
                    username,
                });

                for (let i = 0; i < orderDetail.quantity; i++) {
                    const createTrxDigiflazz = await digiflazzService.createTransaction({
                        productCd: product.code,
                        userId: orderDetail.userId + (orderDetail.serverId ? orderDetail.serverId : "") || "",
                        orderId: `${order.id}_${i}`,
                    });
                    console.log(createTrxDigiflazz);
                    await sleep(500);
                }
                return;
            } else if (productProvider.cd === "LAPAK_GAMING") {
                console.log(
                    `@@@ GAME ORDER OTOMATIS TO LAPAKGAMING ${order.game} ${order.productName} total ${orderDetail.quantity}`,
                );

                const apiKey = configDb.find((item) => item.cd === "api_key_lapakgaming");
                const lapakgamingService = new LapakGamingService(apiKey.value);
                const createTrxLapakgaming = await lapakgamingService.createOrder({
                    userId: orderDetail.userId || "",
                    serverId: orderDetail.serverId || "",
                    product,
                    quantity: orderDetail.quantity,
                    invoiceId: order.invoiceId,
                });
                console.log(createTrxLapakgaming);
                if (createTrxLapakgaming.code === "SUCCESS") {
                    await orderService.updateBy({
                        by: "id",
                        value: order.id,
                        data: {
                            extTrxId: createTrxLapakgaming.data.tid,
                        },
                    });
                }

                return;
            }
        }
    } else if (order.type === OrderType.BUY) {
        const fundService = new FundService();
        const fund = await fundService.findOneBy({
            column: "customerId",
            value: body.customerId,
        });

        if (!fund) {
            await fundService.create({
                id: uuid(),
                customerId: body.customerId,
                name: "Gasskeun Coin",
                value: orderDetail.amount,
            });

            return;
        }

        const balance = fund.value + orderDetail.amount;
        await fundService.updateBy({
            by: "id",
            value: fund.id,
            data: {
                value: balance,
            },
        });

        return;
    }
};

export const processSuccessOrder: IApiRouter = {
    main,
    method,
    auth,
    path,
    xApiKey: new Config().xApiKeyProcessOrder,
};
