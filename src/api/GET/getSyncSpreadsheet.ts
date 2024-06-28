import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { VideoService } from "@serviceInternal/video.service";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { GoogleAppsScript } from "@serviceExternal/googleapps.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/sync-spreadsheet";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const gameService = new GameService();
    const games = await gameService.model.findAll({
        where: {
            cd: ["UCPUBGM", "freefiree", "ML"],
        },
        attributes: ["id", "cd"],
    });

    const productService = new ProductService();
    const products = await productService.model.scope("withPriceBuy").findAll({
        where: {
            gameId: games.map((item) => item.id),
            deleted: false,
            isActive: true,
        },
        order: [["price", "ASC"]],
        attributes: ["gameId", ["name", "denom"], ["code", "cd"], "priceBuy", ["price", "priceSell"]],
    });

    const groupingByGames = games.map((game) => {
        const prods = products.filter((product) => product.gameId === game.id);
        if (prods) {
            return {
                ...game.dataValues,
                data: prods,
            };
        }

        return {
            ...game.dataValues,
            data: undefined,
        };
    });

    const googleAppService = new GoogleAppsScript(
        "https://script.google.com/macros/s/AKfycbwlzO5EGhA5gKmGBNL3QA-knsZlA8hhBmTfoInVpuZmjJeX1z3GNg6uPZ6KnGz-vXZQ5Q/exec",
    );
    googleAppService.sendUpdateData(groupingByGames as any);
    res.send(groupingByGames);
};

export const getSyncSpreadsheets: IApiRouter = {
    path,
    method,
    main,
    auth,
};
