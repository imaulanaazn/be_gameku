import { CheckGameAccount } from "@dto/apiGames.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
import { DigiflazzService } from "@serviceExternal/digiflazz.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";

const schemaValidation: Validation[] = [
    {
        name: "gameCd",
        type: "string",
    },
    {
        name: "userId",
        type: "string",
    },
    {
        name: "serverId",
        type: "string",
    },
];

const path = "/v1/sync-product-digiflazz";
const method = "GET";
const auth = "guess";
const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        gameCd?: string;
        userId?: string;
        serverId?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const checkingGameService = new CheckingGameIdService();
    const checkGame = await checkingGameService.checking({
        gameCd: query.gameCd,
        userId: query.userId,
        serverId: query.serverId,
    });

    return res.send(checkGame);

    // const url = "https://order-sg.codashop.com/initPayment.action";
    // const data = await fetch(url, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         Origin: "https://www.codashop.com",
    //         Referer: "https://www.codashop.com/",
    //         "User-Agent":
    //             "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Mobile Safari/537.36",
    //     },
    //     body: JSON.stringify({
    //         "voucherPricePoint.id": 27670,
    //         "voucherPricePoint.price": 242535.0,
    //         "voucherPricePoint.variablePrice": 0,
    //         n: "12/7/2022-2046",
    //         email: "",
    //         userVariablePrice: 0,
    //         "order.data.profile": "eyJuYW1lIjoiICIsImRhdGVvZmJpcnRoIjoiIiwiaWRfbm8iOiIifQ==",
    //         "user.userId": "348893121",
    //         "user.zoneId": "2053",
    //         msisdn: "",
    //         voucherTypeName: "MOBILE_LEGENDS",
    //         shopLang: "id_ID",
    //         voucherTypeId: 5,
    //         gvtId: 19,
    //         checkoutId: "",
    //         affiliateTrackingId: "",
    //         impactClickId: "",
    //         anonymousId: "",
    //     }),
    // });

    // const test = await data.json();
    // res.send(test);
    // const sysConfigService = new SysConfigService();
    // const sysConfig = await sysConfigService.findManyBy({
    //     column: "cd",
    //     value: ["username_digiflazz", "api_key_digiflazz"],
    //     operator: "in",
    // });

    // const username = sysConfig.find((item) => item.cd === "username_digiflazz").value;
    // console.log(username);
    // const apiKey = sysConfig.find((item) => item.cd === "api_key_digiflazz").value;
    // console.log(apiKey);
    // const digiflazzService = new DigiflazzService({ apiKey, username });
    // const priceList = await digiflazzService.getPriceList();
    // const saldo = await digiflazzService.checkSaldo();
    // const createTrx = await digiflazzService.createTransaction({
    //     productCd: "xld10",
    //     userId: "087800001232",
    //     orderId: "test1",
    // });

    // res.send({ priceList, saldo, createTrx });
    return;
};

export const syncDigiflazzData: IApiRouter = {
    method,
    path,
    auth,
    main,
};
