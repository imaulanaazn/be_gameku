import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ValidatorType } from "@enum/index";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import RedisService from "@serviceExternal/externalRedis.service";
import { GameCategoryDto } from "@dto/gameCategory.dto";

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
    let redisKey = "game-categories";
    const redisService = new RedisService();

    if (query.withGame === "false") {
        const dataFromRedis = await redisService.getJson<GameCategoryDto[]>(redisKey);
        if (dataFromRedis && dataFromRedis.length > 0) {
            return res.send(dataFromRedis);
        }

        const gameCategory = await gameCategoryService.findAllPagination({
            page: 1,
            limit: parseInt(query.limit.toString()),
            sort: "name",
            order: "ASC",
        });

        await redisService.setJson(redisKey, gameCategory.data);

        return res.send(gameCategory.data);
    }

    redisKey += "-with-game";
    const dataFromRedis = await redisService.getJson<GameCategoryDto[]>(redisKey);
    if (dataFromRedis && dataFromRedis.length > 0) {
        return res.send(dataFromRedis);
    }

    const gameCategory = await gameCategoryService.findGameCategoryWithGame(parseInt(query.limit.toString()));

    await redisService.setJson(redisKey, gameCategory);
    return res.send(gameCategory);
};

export const getGameCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
