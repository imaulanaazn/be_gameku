import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { RequestHandler } from "express";

const path = "/v1/game/popular-bulk";
const method = "PUT";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "gameId",
        type: "array",
        required: true,
        items: {
            name: "gameId",
            type: "string",
            required: true,
        },
    },
    {
        name: "isPopular",
        type: "boolean",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        gameId: string[];
        isPopular: boolean;
    }>(schemaValidation, ValidatorType.BODY);
    const gameService = new GameService();
    const game = await gameService.updateBy({
        by: "id",
        value: body.gameId,
        data: {
            isPopular: body.isPopular,
        },
    });
    res.sendStatus(200);
};

export const putPopularBulk: IApiRouter = {
    path,
    method,
    main,
    auth,
};
