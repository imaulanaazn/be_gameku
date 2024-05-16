import { createLogCronjob } from "@helper/logger";
import { IApiRouter } from "@interfaces/index";
import { IProductKupon, KuponService } from "@serviceExternal/kupon.service";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProviderService } from "@serviceInternal/provider.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";

const path = "/v1/sync-product-tokokupon";
const method = "GET";
const auth = "guess";

const getUserPrices = (item: IProductKupon) => {
    const prices = parseInt(item.price.toString());
    let userPrices = 0;
    if (prices > 500000) {
        userPrices = prices + (prices * 2) / 100;
    } else if (prices < 100000) {
        userPrices = prices + (prices * 4) / 100;
    } else {
        userPrices = prices + (prices * 3) / 100;
    }

    return userPrices;
};

const main: RequestHandler = async (req, res) => {
    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["kupon_apikey", "percentage_prices", "percentage_prices_reseller"],
        operator: "in",
    });
    const apiKey = sysConfig.find((item) => item.cd === "kupon_apikey");
    const tokoKuponService = new KuponService(apiKey.value);
    const gameService = new GameService();
    const productService = new ProductService();

    const percentageReseller = sysConfig.find((item) => item.cd === "percentage_prices_reseller");

    const providerService = new ProviderService();
    const provider = await providerService.findOneBy({
        column: "cd",
        value: "KUPON",
    });

    const syncGameCode = ["1"];

    const databaseGame = await gameService.model.findAll({
        where: {
            cd: {
                [Op.in]: syncGameCode,
            },
            provider: provider.id,
        },
    });

    let updatedData = 0;
    let newData = 0;
    for (const gameCd of syncGameCode) {
        const allProduct = await tokoKuponService.getProductByGamesCode({ gameCd });
        const dbGame = databaseGame.find((gameDb) => gameDb.cd === gameCd);
        const productsDb = await productService.model.findAll({
            where: {
                gameId: dbGame.id,
            },
        });
        for (const kuponProduct of allProduct.data.products) {
            const checkDbProduct = productsDb.find((item) => item.code === kuponProduct.id.toString());
            if (checkDbProduct) {
                updatedData++;
                const userPrices = getUserPrices(kuponProduct);
                await productService.updateBy({
                    by: "id",
                    value: checkDbProduct.id,
                    data: {
                        price: userPrices,
                        resellerPrice:
                            parseInt(kuponProduct.price.toString()) +
                            (parseInt(kuponProduct.price.toString()) * parseInt(percentageReseller.value)) / 100,
                        priceBuy: parseInt(kuponProduct.price.toString()),
                        isActive: kuponProduct.isActive,
                        ...(!kuponProduct.isActive ? { isDisplayed: false } : {}),
                    },
                });
            } else {
                newData++;
                const userPrices = getUserPrices(kuponProduct);
                await productService.create({
                    id: uuid(),
                    gameId: dbGame.id,
                    categoryId: "",
                    name: kuponProduct.name,
                    code: kuponProduct.id.toString(),
                    price: userPrices,
                    resellerPrice:
                        parseInt(kuponProduct.price.toString()) +
                        (parseInt(kuponProduct.price.toString()) * parseInt(percentageReseller.value)) / 100,
                    priceBuy: parseInt(kuponProduct.price.toString()),
                    isActive: kuponProduct.isActive,
                    isDisplayed: kuponProduct.isActive,
                    logoDenom: "",
                    deleted: false,
                    automatically: true,
                });
            }
        }
    }

    const log = createLogCronjob();
    log.log(`@@@REPORT Updated ${updatedData}, NEW Data ${newData}`);
    res.sendStatus(200);
    return;
};

export const syncTokoKuponData: IApiRouter = {
    method,
    path,
    auth,
    main,
};
