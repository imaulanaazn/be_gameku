import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { RequestHandler } from "express";

const path = "/v1/game/:id";
const method = "DELETE";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const gameId = param.id.split(",");

    const gameService = new GameService();
    await gameService.updateBy({
        by: "id",
        value: gameId,
        data: {
            deleted: true,
        },
    });
    res.sendStatus(200);
};

export const deleteGame: IApiRouter = {
    path,
    method,
    main,
    auth,
};
