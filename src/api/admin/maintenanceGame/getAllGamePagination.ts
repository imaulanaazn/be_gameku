import { GameDto } from "@dto/game.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { RequestHandler } from "express";

const path = "/v1/game";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const gameService = new GameService();
    const gameCategoryService = new GameCategoryService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const game = await gameService.findManyByPagination(
            {
                column: column[0] as keyof GameDto,
                value: `%${query[column[0]]}%`,
                operator: "like",
            },
            {
                page: query.page,
                sort: query.sort,
                order: query.order,
                limit: query.limit,
            },
            {
                column: "deleted",
                value: false,
            },
        );

        const gameCategId = game.rows.map((game) => game.categoryId);
        const gameCategory = await gameCategoryService.findManyBy({
            column: "id",
            value: gameCategId,
            operator: "in",
        });

        const newData = [];
        for (const g of game.rows) {
            const category = gameCategory.find((categ) => categ.id === g.categoryId);
            if (category) {
                newData.push({ ...g.dataValues, categoryName: category.name });
            }
        }

        return res.send({
            data: newData,
            page: query.page,
            total: game.count,
            totalPage: Math.ceil(game.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const game = await gameService.findAllPagination(
        {
            page: query.page,
            sort: query.sort,
            order: query.order,
            limit: query.limit,
        },
        {
            column: "deleted",
            value: false,
        },
    );

    const gameCategId = game.data.map((game) => game.categoryId);
    const gameCategory = await gameCategoryService.findManyBy({
        column: "id",
        value: gameCategId,
        operator: "in",
    });

    const newData = [];
    for (const g of game.data) {
        const category = gameCategory.find((categ) => categ.id === g.categoryId);
        if (category) {
            newData.push({ ...g.dataValues, categoryName: category.name });
        }
    }

    return res.send({
        data: newData,
        page: query.page,
        total: game.total,
        totalPage: Math.ceil(game.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllGamePagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
