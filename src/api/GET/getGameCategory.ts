import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { GameCategoryDto } from "@dto/gameCategory.dto";

const path = "/v1/games-category";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
    const di = req.di;
    const query = new Validator(req, res).process<{
        limit: number;
        withGame: "true" | "false";
    }>(schemaValidation, ValidatorType.QUERY);

    const gameCategoryService = new GameCategoryService();
    let redisKey = "game-categories";

    if (query.withGame === "false") {
        const dataFromRedis = await di.redisService.getObject<GameCategoryDto[]>(redisKey);
        if (dataFromRedis && dataFromRedis.length > 0) {
            return res.send(dataFromRedis);
        }

        const gameCategory = await gameCategoryService.findAllPagination({
            page: 1,
            limit: parseInt(query.limit.toString()),
            sort: "name",
            order: "ASC",
        });

        await di.redisService.setObject(redisKey, gameCategory.data);

        return res.send(gameCategory.data);
    }

    redisKey += "-with-game";
    const dataFromRedis = await di.redisService.getObject<GameCategoryDto[]>(redisKey);
    if (dataFromRedis && dataFromRedis.length > 0) {
        return res.send(dataFromRedis);
    }

    const gameCategory = await gameCategoryService.findGameCategoryWithGame(parseInt(query.limit.toString()));

    await di.redisService.setObject(redisKey, gameCategory);
    return res.send(gameCategory);
};

export const getGameCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
