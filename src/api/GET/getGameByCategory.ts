import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { BusinessError } from "@helper/handleError";
import { Op, col, fn } from "sequelize";

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
    {
        name: "distinct",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        categoryId?: string;
        isPopular?: "true" | "false";
        search?: string;
        distinct?: "true" | "false";
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
            });

            return res.send(games);
        }

        const gamesPopular = await gameService.findManyBy({
            column: "isPopular",
            value: true,
        });

        const games = gamesPopular.sort((a, b) => a.name.localeCompare(b.name));

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
            const games = await gameService.model.findAll({
                where: {
                    categoryId: query.categoryId,
                    name: {
                        [Op.like]: "%" + query.search + "%",
                    },
                    deleted: false,
                },
            });

            const newGames = games.sort((a, b) => a.name.localeCompare(b.name));
            return res.send(newGames);
        }

        const games = await gameService.model.findAll({
            where: {
                categoryId: query.categoryId,
                deleted: false,
            },
        });

        const newGames = games.sort((a, b) => a.name.localeCompare(b.name));
        return res.send(newGames);
    }

    if (query.search) {
        const games = await gameService.model.findAll({
            where: {
                name: {
                    [Op.like]: query.search + "%",
                },
                deleted: false,
            },
        });

        const newGames = games.sort((a, b) => a.name.localeCompare(b.name));
        return res.send(newGames);
    }

    if (query.distinct) {
        const games = await gameService.model.findAll({
            attributes: ["id", "name"],
            where: {
                deleted: false,
            },
        });

        const newGames = games.sort((a, b) => a.name.localeCompare(b.name));
        return res.send(newGames);
    }

    const games = await gameService.model.findAll({
        where: {
            deleted: false,
        },
    });
    const newGames = games.sort((a, b) => a.name.localeCompare(b.name));
    return res.send(newGames);
};

export const getGameByCategory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
