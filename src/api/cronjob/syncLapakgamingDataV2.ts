import { CheckGameAccount } from "@dto/apiGames.dto";
import { ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import generateSlug from "@helper/generateSlug";
import { sleep } from "@helper/index";
import { createLogCronjob } from "@helper/logger";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
import { DigiflazzService } from "@serviceExternal/digiflazz.service";
import { IProductLapakGaming, LapakGamingService } from "@serviceExternal/lapakgaming.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProviderService } from "@serviceInternal/provider.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v2/sync-product-lapakgaming";
const method = "GET";
const auth = "guess";

const getUserPrices = (item: IProductLapakGaming) => {
    const lapakGamingPrices = parseInt(item.price.toString());
    let userPrices = 0;
    if (lapakGamingPrices > 500000) {
        userPrices = lapakGamingPrices + (lapakGamingPrices * 2) / 100;
    } else if (lapakGamingPrices < 100000) {
        userPrices = lapakGamingPrices + (lapakGamingPrices * 4) / 100;
    } else {
        userPrices = lapakGamingPrices + (lapakGamingPrices * 3) / 100;
    }

    return userPrices;
};

const main: RequestHandler = async (req, res) => {
    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_key_lapakgaming", "percentage_prices", "percentage_prices_reseller"],
        operator: "in",
    });
    const apiKey = sysConfig.find((item) => item.cd === "api_key_lapakgaming");
    const lapakgamingService = new LapakGamingService(apiKey.value);
    const gameService = new GameService();
    const productService = new ProductService();

    const percentageReseller = sysConfig.find((item) => item.cd === "percentage_prices_reseller");

    const providerService = new ProviderService();
    const provider = await providerService.findOneBy({
        column: "cd",
        value: "LAPAK_GAMING",
    });
    const [lapakgamingGames, databaseGames] = await Promise.all([
        lapakgamingService.getGames(),
        // gameService.findManyBy({
        //     column: "provider",
        //     value: provider.id,
        // }),
        gameService.model.findAll({
            where: {
                provider: provider.id,
                deleted: false,
            },
        }),
    ]);
    let updatedData = 0;
    let newData = 0;
    const dataGamesLapakGaming = lapakgamingGames.data.categories;
    res.sendStatus(200);
    for (const lapakGamingGame of dataGamesLapakGaming) {
        const lapakGamingProducts = await lapakgamingService.getProductByGamesCode({
            gameCd: lapakGamingGame.code,
        });

        const databaseGame = databaseGames.find((gameDb) => gameDb.cd === lapakGamingGame.code);
        if (databaseGame) {
            const productDb = await productService.model.findAll({
                where: {
                    gameId: databaseGame.id,
                },
            });

            const dataProductsLapakGaming = lapakGamingProducts.data.products;
            for (const lapakGamingProduct of dataProductsLapakGaming) {
                const databaseProduct = productDb.find((product) => product.code === lapakGamingProduct.code);
                const userPrices = getUserPrices(lapakGamingProduct);
                if (databaseProduct) {
                    updatedData++;
                    await productService.updateBy({
                        by: "id",
                        value: databaseProduct.id,
                        data: {
                            price: userPrices,
                            resellerPrice:
                                parseInt(lapakGamingProduct.price.toString()) +
                                (parseInt(lapakGamingProduct.price.toString()) * parseInt(percentageReseller.value)) /
                                    100,
                            priceBuy: parseInt(lapakGamingProduct.price.toString()),
                            isActive: lapakGamingProduct.status === "available" ? true : false,
                        },
                    });
                } else {
                    newData++;
                    await productService.create({
                        id: uuid(),
                        gameId: databaseGame.id,
                        categoryId: "68734304-de09-49fb-b514-1495da70e2e4",
                        name: lapakGamingProduct.name,
                        code: lapakGamingProduct.code,
                        price: userPrices,
                        resellerPrice:
                            parseInt(lapakGamingProduct.price.toString()) +
                            (parseInt(lapakGamingProduct.price.toString()) * parseInt(percentageReseller.value)) / 100,
                        priceBuy: parseInt(lapakGamingProduct.price.toString()),
                        isActive: lapakGamingProduct.status === "available" ? true : false,
                        logoDenom: "",
                        deleted: false,
                        automatically: true,
                    });
                }
            }
        }

        await sleep(500);
    }

    const log = createLogCronjob();
    log.log(`@@@REPORT Updated ${updatedData}, NEW Data ${newData}`);
    return;
};

export const syncLapakgamingDataV2: IApiRouter = {
    method,
    path,
    auth,
    main,
};
