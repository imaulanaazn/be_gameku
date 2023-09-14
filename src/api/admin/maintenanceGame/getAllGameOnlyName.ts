import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { RequestHandler } from "express";

const path = "/v1/game/attr";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "only",
        type: "string",
        required: false,
        default: "id,name",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        only?: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const only = query.only.split(",");
    const gameService = new GameService();
    const games = await gameService.find({
        attributes: only,
    });
    return res.send(games);
};

export const getAllGameOnlyName: IApiRouter = {
    main,
    path,
    method,
    auth,
};
