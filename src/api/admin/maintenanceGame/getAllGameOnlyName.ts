import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { RequestHandler } from "express";

const path = "/v1/game/attr";
const method = APIMethod.GET;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "only",
        type: "string",
        required: false,
        default: "id,name",
    },
    {
        name: "conditional",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        only?: string;
        conditional?: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const only = query.only.split(",");
    const gameService = new GameService();
    let where = {
        deleted: false,
    };
    if (query.conditional) {
        const data = query.conditional.split(":");
        where = {
            ...where,
            [data[0]]: data[1],
        };
    }
    const games = await gameService.find({
        where,
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
