import { Config } from "@config/index";
import {
  InvoiceStatuses,
  OrderStatuses,
  OrderType,
  ValidatorType,
  VoucherType,
} from "@enum/index";
import { sleep } from "@helper/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
// import APIGamesService from "@serviceExternal/apiGames.service";
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
// import { DigiflazzService } from "@serviceExternal/digiflazz.service";
// import { LapakGamingService } from "@serviceExternal/lapakgaming.service";
import { KuponService } from "@serviceExternal/kupon.service";
import { OrderPending3rdPartyService } from "@serviceInternal/orderPending3rdParty.service";
import { APIAuth, APIMethod } from "@enum/index";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import dayjs from "dayjs";
import { CustomerService } from "@serviceInternal/customer.service";
import { MiracleGamingService } from "@serviceExternal/miracleGaming.service";

const path = "/v1/gameku/process-order-success";
const method = APIMethod.POST;
const auth = APIAuth.WEBHOOK_INTERNAL;

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
  const paymentMethodService = new PaymentMethodService();
  const sysConfigService = new SysConfigService();
  const configDb = await sysConfigService.findManyBy({
    column: "cd",
    value: [
      // "api_games_merchant_id",
      // "api_games_secret_key",
      // "api_key_digiflazz",
      // "username_digiflazz",
      // "api_key_lapakgaming",
      // "kupon_apikey",
      "api_key_miraclegaming",
    ],
    operator: "in",
  });

  const order = await orderService.model.scope("withAmtBuy").findOne({
    where: {
      id: body.orderId,
    },
  });

  const paymentMethod = await paymentMethodService.model.findOne({
    where: {
      id: order.paymentMethodId,
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
    const product = await productService.model.scope("withPriceBuy").findOne({
      where: {
        id: orderDetail.productId,
      },
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

    // if (
    //   process.env.NODE_ENV.toLowerCase() === "development" ||
    //   !process.env.NODE_ENV
    // ) {
    //   await orderService.updateBy({
    //     by: "id",
    //     value: order.id,
    //     data: {
    //       status: OrderStatuses.SUCCESS,
    //     },
    //   });

    //   const customerService = new CustomerService();
    //   const customer = await customerService.model.findOne({
    //     where: {
    //       id: order.customerId,
    //     },
    //   });
    //   if (customer.isRegistered) {
    //     const fundService = new FundService();
    //     let fund = await fundService.findOneBy({
    //       column: "customerId",
    //       value: customer.id,
    //     });

    //     if (!fund) {
    //       await fundService.create({
    //         id: uuid(),
    //         customerId: customer.id,
    //         name: "Gameku Coin",
    //         value: 0,
    //       });

    //       fund = await fundService.findOneBy({
    //         column: "customerId",
    //         value: customer.id,
    //       });
    //     }

    //     console.log(fund.value);
    //     console.log(order.amtBuy);
    //     // await fundService.updateBy({
    //     //     by: "customerId",
    //     //     value: customer.id,
    //     //     data: {
    //     //         value: Math.ceil(fund.value + order.amtBuy),
    //     //     },
    //     // });
    //   }

    //   return;
    // }

    if (product.automatically) {
      await orderService.updateBy({
        by: "id",
        value: order.id,
        data: {
          status: OrderStatuses.PROCESSING,
        },
      });

      //   if (productProvider.cd === "API_GAMES") {
      //     const merchantId = configDb.find(
      //       (item) => item.cd === "api_games_merchant_id"
      //     );
      //     const secretKey = configDb.find(
      //       (item) => item.cd === "api_games_secret_key"
      //     );
      //     const apiGamesService = new APIGamesService({
      //       merchantId: merchantId.value,
      //       secretKey: secretKey.value,
      //     });

      //     console.log(
      //       `@@@ GAME ORDER OTOMATIS TO API GAMES ${order.game} ${order.productName} total ${orderDetail.quantity}`
      //     );
      //     for (let i = 0; i < orderDetail.quantity; i++) {
      //       const createTrxApiGames = await apiGamesService.createTransaction({
      //         invoiceId: `${order.invoiceId}_${i}`,
      //         productCode: product.code,
      //         userId: orderDetail.userId,
      //         serverId: orderDetail.serverId || "",
      //       });
      //       console.log(createTrxApiGames);
      //       await sleep(500);
      //     }
      //     return;
      //   } else if (productProvider.cd === "DIGIFLAZZ") {
      //     console.log(
      //       `@@@ GAME ORDER OTOMATIS TO DIGIFLAZZ ${order.game} ${order.productName} total ${orderDetail.quantity}`
      //     );
      //     const username = configDb.find(
      //       (item) => item.cd === "username_digiflazz"
      //     ).value;
      //     const apiKey = configDb.find(
      //       (item) => item.cd === "api_key_digiflazz"
      //     ).value;
      //     const digiflazzService = new DigiflazzService({
      //       apiKey,
      //       username,
      //     });

      //     for (let i = 0; i < orderDetail.quantity; i++) {
      //       const createTrxDigiflazz = await digiflazzService.createTransaction({
      //         productCd: product.code,
      //         userId:
      //           orderDetail.userId +
      //             (orderDetail.serverId ? orderDetail.serverId : "") || "",
      //         orderId: `${order.id}_${i}`,
      //       });
      //       console.log(createTrxDigiflazz);
      //       await sleep(500);
      //     }
      //     return;
      //   } else if (productProvider.cd === "LAPAK_GAMING") {
      //     console.log(
      //       `@@@ GAME ORDER OTOMATIS TO LAPAKGAMING ${order.game} ${order.productName} total ${orderDetail.quantity}`
      //     );

      //     const apiKey = configDb.find(
      //       (item) => item.cd === "api_key_lapakgaming"
      //     );
      //     const lapakgamingService = new LapakGamingService(apiKey.value);
      //     const createTrxLapakgaming = await lapakgamingService.createOrder({
      //       userId: orderDetail.userId || "",
      //       serverId: orderDetail.serverId || "",
      //       product,
      //       quantity: orderDetail.quantity,
      //       invoiceId: order.invoiceId,
      //     });
      //     const resendCodeStatus = ["TIMEOUT", "INSUFFICIENT_BALANCE"];
      //     console.log(createTrxLapakgaming);
      //     if (createTrxLapakgaming.code === "SUCCESS") {
      //       await orderService.updateBy({
      //         by: "id",
      //         value: order.id,
      //         data: {
      //           extTrxId: createTrxLapakgaming.data.tid,
      //         },
      //       });
      //     } else if (resendCodeStatus.includes(createTrxLapakgaming.code)) {
      //       await orderService.updateBy({
      //         by: "id",
      //         value: order.id,
      //         data: {
      //           isError: true,
      //           isCanResend: true,
      //           remark: createTrxLapakgaming.code,
      //         },
      //       });
      //     } else {
      //       const refundCd = ["GAMEKU_USER", "GAMEKU"];

      //       await orderService.updateBy({
      //         by: "id",
      //         value: order.id,
      //         data: {
      //           ...(refundCd.includes(paymentMethod.cd)
      //             ? { status: OrderStatuses.REFUNDED }
      //             : {}),
      //           isError: false,
      //           isCanResend: false,
      //           remark: createTrxLapakgaming.code + " (Infokan developer)",
      //         },
      //       });
      //     }

      //     return;
      //   } else if (productProvider.cd === "KUPON") {
      //     console.log(
      //       `@@@ GAME ORDER OTOMATIS TO TOKOKUPON ${order.game} ${order.productName} total ${orderDetail.quantity}`
      //     );

      //     const apiKey = configDb.find((item) => item.cd === "kupon_apikey");
      //     const tokoKuponService = new KuponService(apiKey.value);
      //     const body = {
      //       productCode: parseInt(product.code),
      //       quantity: orderDetail.quantity,
      //       userId: orderDetail.userId || "",
      //       serverId: orderDetail.serverId || "",
      //     };
      //     console.log("Body Request Create TRX to Toko Kupon");
      //     console.log(body);
      //     const createTrx = await tokoKuponService.createOrder(body);
      //     console.log(createTrx);

      //     if (createTrx.success) {
      //       await orderService.updateBy({
      //         by: "id",
      //         value: order.id,
      //         data: {
      //           extTrxId: createTrx.data.invoiceNumber,
      //         },
      //       });

      //       const orderPending3rdParty = new OrderPending3rdPartyService();
      //       await orderPending3rdParty.create({
      //         id: uuid(),
      //         providerId: productProvider.id,
      //         extInvoiceNumber: createTrx.data.invoiceNumber,
      //       });
      //     } else {
      //       await orderService.updateBy({
      //         by: "id",
      //         value: order.id,
      //         data: {
      //           isError: true,
      //           isCanResend: false,
      //           remark: createTrx.message + " (Infokan developer)",
      //         },
      //       });
      //     }
      //   } else
      if (productProvider.cd === "MIRACLE_GAMING") {
        console.log(
          `@@@ GAME ORDER OTOMATIS TO MIRACLEGAMING ${order.game} ${order.productName} total ${orderDetail.quantity}`
        );

        const apiKey = configDb.find(
          (item) => item.cd === "api_key_miraclegaming"
        );
        const miraclegamingService = new MiracleGamingService(apiKey.value);

        try {
          const createTrxMiraclegaming = await miraclegamingService.createOrder(
            {
              userId: orderDetail.userId || "",
              serverId: orderDetail.serverId || "",
              product,
              invoiceId: order.invoiceId,
            }
          );
          if (createTrxMiraclegaming.status) {
            await orderService.updateBy({
              by: "id",
              value: order.id,
              data: {
                extTrxId: createTrxMiraclegaming.data.id,
              },
            });

            let errorCount = 0;

            const getOrder3rdPartyStatus = setInterval(async () => {
              try {
                const order3rdParty = await miraclegamingService.getOrderStatus(
                  createTrxMiraclegaming.data.id
                );

                let orderStatus: OrderStatuses;
                switch (order3rdParty.data.status) {
                  case "success":
                    orderStatus = OrderStatuses.SUCCESS;
                    break;
                  case "pending":
                    orderStatus = OrderStatuses.PENDING_ORDER;
                    break;
                  case "processing":
                    orderStatus = OrderStatuses.PROCESSING;
                    break;
                  case "cancel":
                    orderStatus = OrderStatuses.FAILED;
                    break;
                  case "refund":
                    const refundCd = ["GAMEKU_USER", "GAMEKU"];
                    orderStatus = refundCd.includes(paymentMethod.cd)
                      ? OrderStatuses.REFUNDED
                      : OrderStatuses.FAILED;
                    break;
                  default:
                    orderStatus = OrderStatuses.PENDING_ORDER;
                    break;
                }

                await orderService.updateBy({
                  by: "id",
                  value: order.id,
                  data: {
                    status: orderStatus,
                    isError: false,
                    isCanResend: false,
                    remark: createTrxMiraclegaming.msg + " (Infokan developer)",
                  },
                });

                if (
                  orderStatus === OrderStatuses.SUCCESS ||
                  orderStatus === OrderStatuses.FAILED ||
                  orderStatus === OrderStatuses.REFUNDED
                ) {
                  clearInterval(getOrder3rdPartyStatus);
                }
              } catch (err) {
                console.error("Error getting status:", err);
                if (errorCount >= 10) {
                  clearInterval(getOrder3rdPartyStatus);
                }
                errorCount++;
              }
            }, 2500);
          } else {
            throw new Error(createTrxMiraclegaming.msg);
          }
        } catch (error) {
          await orderService.updateBy({
            by: "id",
            value: order.id,
            data: {
              status: OrderStatuses.FAILED,
              isError: true,
              isCanResend: true,
              remark: error.msg,
            },
          });
        }

        return;
      }
    }
  } else if (order.type === OrderType.BUY) {
    await orderService.updateBy({
      by: "id",
      value: order.id,
      data: {
        status: OrderStatuses.PROCESSING,
      },
    });

    const fundService = new FundService();
    const fund = await fundService.findOneBy({
      column: "customerId",
      value: body.customerId,
    });

    if (!fund) {
      await fundService.create({
        id: uuid(),
        customerId: body.customerId,
        name: "Gameku Cash",
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

    await orderService.updateBy({
      by: "id",
      value: order.id,
      data: {
        status: OrderStatuses.SUCCESS,
        completedAt: dayjs().toDate(),
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
