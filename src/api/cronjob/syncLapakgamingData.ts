import { CheckGameAccount } from "@dto/apiGames.dto";
import { ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import generateSlug from "@helper/generateSlug";
import { sleep } from "@helper/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
import { DigiflazzService } from "@serviceExternal/digiflazz.service";
import { LapakGamingService } from "@serviceExternal/lapakgaming.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProviderService } from "@serviceInternal/provider.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v1/sync-product-lapakgaming";
const method = "GET";
const auth = "guess";
const main: RequestHandler = async (req, res) => {
    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_key_lapakgaming", "percentage_prices", "percentage_prices_reseller"],
        operator: "in",
    });

    const percentageUser = sysConfig.find((item) => item.cd === "percentage_prices");
    const percentageReseller = sysConfig.find((item) => item.cd === "percentage_prices_reseller");

    const providerService = new ProviderService();
    const provider = await providerService.findOneBy({
        column: "cd",
        value: "LAPAK_GAMING",
    });

    const gameService = new GameService();
    const games = await gameService.findManyBy({
        column: "provider",
        value: provider.id,
    });
    const apiKey = sysConfig.find((item) => item.cd === "api_key_lapakgaming");
    const lapakgamingService = new LapakGamingService(apiKey.value);
    const lapakgamingGames = await lapakgamingService.getGames();
    const allProductsFromLapakGaming = await lapakgamingService.getAllProducts();
    const dataGamesLapakGaming = lapakgamingGames.data.categories;

    let count = 0;
    for (const gameLapakGaming of dataGamesLapakGaming) {
        count++;
        const gameDb = games.find((item) => item.cd === gameLapakGaming.code);
        const serverId = gameLapakGaming.forms.find((item) => item.name === "additional_id");
        const needServerId = serverId ? true : false;
        const gameType = gameLapakGaming.variant === "DIGITAL" ? "topup" : "voucher";
        const serverIdtype = needServerId && serverId.type === "option" ? ServerIdType.LIST : ServerIdType.INPUT;
        if (!gameDb) {
            const gameId = uuid();
            await gameService.create({
                id: gameId,
                provider: provider.id,
                categoryId: "3478fb31-a9c0-42c1-ac17-7e8a5890b9d5",
                name: gameLapakGaming.name,
                automatically: false,
                cd: gameLapakGaming.code,
                logoUrl: "",
                isPopular: false,
                slug: generateSlug(gameLapakGaming.name),
                deleted: true,
                type: gameType,
                description: "",
                needServerId,
                needCheckId: false,
                typeServerId: serverIdtype,
                voucherType: VoucherType.EXTERNAL,
            });

            if (serverIdtype === ServerIdType.LIST) {
                const options = serverId.options.filter((item) => !(item.value === ""));
                const savedData = options.map((item) => {
                    return {
                        id: uuid(),
                        gameId,
                        label: item.name,
                        value: item.value,
                        createdAt: dayjs().toDate(),
                    };
                });
                const listServerService = new ListServerService();
                await listServerService.model.bulkCreate(savedData);
            }

            const productsLapakGaming = await lapakgamingService.getProductByGamesCode({
                gameCd: gameLapakGaming.code,
            });
            const productService = new ProductService();
            const productData = productsLapakGaming.data.products.map((item) => {
                return {
                    id: uuid(),
                    categoryId: "",
                    name: item.name,
                    automatically: true,
                    code: item.code,
                    price: item.price + (item.price * parseInt(percentageUser.value)) / 100,
                    resellerPrice: item.price + (item.price * parseInt(percentageReseller.value)) / 100,
                    priceBuy: item.price,
                    logoDenom: "",
                    gameId: gameId,
                    deleted: true,
                    isActive: item.status === "available" ? true : false,
                };
            });
            await productService.model.bulkCreate(productData);
        } else {
            const productService = new ProductService();
            const prodsDb = await productService.findManyBy({
                column: "gameId",
                value: gameDb.id,
            });

            for (const prod of prodsDb) {
                const prodLapak = allProductsFromLapakGaming.data.products.find((item) => item.code === prod.code);
                if (prodLapak) {
                    await productService.updateBy({
                        by: "id",
                        value: prod.id,
                        data: {
                            price: prodLapak.price + (prodLapak.price * parseInt(percentageUser.value)) / 100,
                            resellerPrice:
                                prodLapak.price + (prodLapak.price * parseInt(percentageReseller.value)) / 100,
                            priceBuy: prodLapak.price,
                            isActive: prodLapak.status === "available" ? true : false,
                        },
                    });
                }
            }
        }

        await sleep(500);
    }
    return res.sendStatus(200);
};

export const syncLapakgamingData: IApiRouter = {
    method,
    path,
    auth,
    main,
};
