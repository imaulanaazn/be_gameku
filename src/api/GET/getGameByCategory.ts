import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { GameService } from "@serviceInternal/game.service";
import { GameDto } from "@dto/index";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { BusinessError } from "@helper/handleError";
import { Op } from "sequelize";

const path = "/v1/games";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "categoryId",
        type: "string",
        required: false,
    },
    {
        name: "isPopular",
        type: "string",
        default: "false",
        required: false,
        enum: ["true", "false"],
    },
    {
        name: "search",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        categoryId: string;
        isPopular: "true" | "false";
        search: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const gameService = new GameService();
    const gameCategoryService = new GameCategoryService();

    if (query.isPopular === "true") {
        if (query.search) {
            const games = await gameService.find({
                where: {
                    isPopular: true,
                    name: {
                        [Op.like]: "%" + query.search + "%",
                    },
                    deleted: false,
                },
                order: [["popSequence", "ASC"]],
            });

            return res.send(games);
        }

        const gamesPopular = await gameService.findManyBy({
            column: "isPopular",
            value: true,
        });

        const games = gamesPopular.sort((a, b) => a.popSequence - b.popSequence);

        return res.send(games);
    }

    if (query.categoryId) {
        const category = await gameCategoryService.findOneBy({
            column: "id",
            value: query.categoryId,
        });

        if (!category) {
            throw new BusinessError("Game Category ID tidak valid: " + query.categoryId, ErrorType.NotFound);
        }

        if (query.search) {
            const games = await gameService.find({
                where: {
                    categoryId: query.categoryId,
                    name: {
                        [Op.like]: "%" + query.search + "%",
                    },
                    deleted: false,
                },
            });

            return res.send(games);
        }

        const games = await gameService.find({
            where: {
                categoryId: query.categoryId,
                deleted: false,
            },
        });

        return res.send(games);
    }

    if (query.search) {
        const games = await gameService.find({
            where: {
                name: {
                    [Op.like]: query.search + "%",
                },
                deleted: false,
            },
        });

        return res.send(games);
    }

    const games = await gameService.findAll();
    const filteredGame = games.filter((game) => !game.deleted);
    return res.send(filteredGame);
};

export const getGameByCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
