import { ProductDto } from "@dto/product.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";

const path = "/v1/orders";
const method = "GET";
const auth = "admin";

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
    const productService = new ProductService();
    const column = Object.keys(query);

    if (column.length > 4) {
        const products = await productService.findManyByPagination(
            {
                column: column[0] as keyof ProductDto,
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

        const gameId = products.rows.map((product) => product.gameId);

        const games = await gameService.findManyBy({
            column: "id",
            value: gameId,
            operator: "in",
            only: ["name", "id", "logoDenom", "logoUrl"],
        });

        const newData = [];
        for (const product of products.rows) {
            const game = games.find((game) => game.id === product.gameId);
            if (game) {
                console.log(game);
                console.log(product);
                newData.push({
                    ...product.dataValues,
                    gameName: game.name,
                    logoDenom: product.logoDenom || game.logoDenom || game.logoUrl,
                });
            }
        }

        return res.send({
            data: newData,
            page: query.page,
            total: products.count,
            totalPage: Math.ceil(products.count / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    const products = await productService.findAllPagination(
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

    const gameId = products.data.map((product) => product.gameId);

    const games = await gameService.findManyBy({
        column: "id",
        value: gameId,
        operator: "in",
        only: ["name", "id", "logoDenom", "logoUrl"],
    });

    const newData = [];
    for (const product of products.data) {
        const game = games.find((game) => game.id === product.gameId);
        console.log(game.logoDenom);
        if (game) {
            console.log(game);
            console.log(product);
            newData.push({
                ...product.dataValues,
                gameName: game.name,
                logoDenom: product.logoDenom || game.logoDenom || game.logoUrl,
            });
        }
    }

    return res.send({
        data: newData,
        page: query.page,
        total: products.total,
        totalPage: Math.ceil(products.total / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllOrdersPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
