import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { ProductEntity } from "@entity/product.entity";
import { GameService } from "@serviceInternal/game.service";

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

    res.send({
        ...game.dataValues,
        products,
    });
};

export const getGameDetailById: IApiRouter = {
    main,
    path,
    method,
    auth,
};
