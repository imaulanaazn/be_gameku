import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ServerIdType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";

const path = "/v1/game-detail";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: false,
    },
    {
        name: "slug",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        id: string;
        slug: string;
    }>(schemaValidation, ValidatorType.QUERY);

    if (!query.id && !query.slug) {
        throw new BusinessError(
            "Setidaknya query param harus ada salah satu dari game id atau game slug",
            ErrorType.Validation,
        );
    }

    const gameService = new GameService();
    const game = await gameService.findOneBy({
        column: query.id ? "id" : "slug",
        value: query.id || query.slug,
    });

    if (!game) {
        throw new BusinessError(`Game tidak ditemukan dengan id: ${query.id}`, ErrorType.NotFound);
    }

    const productService = new ProductService();
    const products = await productService.findManyBy({
        column: "gameId",
        value: game.id,
    });

    const listServerService = new ListServerService();
    let listServers;
    if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
        listServers = await listServerService.findManyBy({
            column: "gameId",
            value: game.id,
        });
    }

    products.sort((a, b) => a.price - b.price);
    res.send({
        ...game.dataValues,
        products,
        servers: listServers,
    });
};

export const getGameDetailById: IApiRouter = {
    main,
    path,
    method,
    auth,
};
