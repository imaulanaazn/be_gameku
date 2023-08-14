import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { GameService } from "@serviceInternal/game.service";
import { GameDto } from "@dto/index";

const path = "/v1/games-by";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "category",
        type: "string",
        required: false,
    },
    {
        name: "max",
        type: "number",
        default: 10,
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        category: string;
        max: number;
    }>(schemaValidation, ValidatorType.QUERY);

    const gameService = new GameService();
    let games: GameDto[] = [];

    if (query.category === "popular") {
        games = await gameService.findManyBy({
            column: "isPopular",
            value: true,
        });
    } else if (query.category === "mobile") {
        games = await gameService.findManyBy({
            column: "platform",
            value: ["mobile", "pcmobile"],
            operator: "or",
        });
    } else if (query.category === "pc") {
        games = await gameService.findManyBy({
            column: "platform",
            value: ["pc", "pcmobile"],
            operator: "or",
        });
    } else {
        games = await gameService.findGameByCategory(query.category);
    }

    return res.send(games);
};

export const getGameByCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
