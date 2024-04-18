import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";

const path = "/v1/games-category";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "withGame",
        type: "string",
        enum: ["true", "false"],
        default: "false",
        required: false,
    },
    {
        name: "limit",
        type: "number",
        default: 100,
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        limit: number;
        withGame: "true" | "false";
    }>(schemaValidation, ValidatorType.QUERY);

    const gameCategoryService = new GameCategoryService();

    if (query.withGame === "false") {
        const gameCategory = await gameCategoryService.findAllPagination({
            page: 1,
            limit: parseInt(query.limit.toString()),
            sort: "name",
            order: "ASC",
        });
        return res.send(gameCategory.data);
    }

    const gameCategory = await gameCategoryService.findGameCategoryWithGame(parseInt(query.limit.toString()));
    return res.send(gameCategory);
};

export const getGameCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
