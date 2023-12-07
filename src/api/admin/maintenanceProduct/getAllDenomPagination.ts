import { ProductDto } from "@dto/product.dto";
import { GameEntity } from "@entity/game.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";
import { Op, col, fn } from "sequelize";

const path = "/v1/denom";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: false,
    },
    {
        name: "code",
        type: "string",
        required: false,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
    },
    {
        name: "status",
        type: "string",
        required: false,
        enum: ["active", "archive"],
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
        code?: string;
        gameId?: string;
        status?: "active" | "archive";
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.status;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const gameService = new GameService();
    const productService = new ProductService();
    const orderDetailService = new OrderDetailService();
    const column = Object.keys(query);

    let where: any = {};
    if (column.length > 4) {
        if (query.status) {
            where = {
                ...where,
                isActive: query.status === "active",
            };
        }

        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const products = await productService.model.scope("withPriceBuy").findAndCountAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        order: [[query.sort, query.order]],
        where: {
            ...where,
            deleted: false,
        },
        include: [
            {
                model: GameEntity,
                required: true,
                attributes: ["name", "id", "logoDenom", "logoUrl"],
            },
        ],
    });

    const orderDetail: { dataValues: { productId: string; totalSold: number } }[] = await orderDetailService.find({
        where: {
            productId: products.rows.map((item) => item.id),
        },
        attributes: [
            ["product_id", "productId"],
            [fn("SUM", col("quantity")), "totalSold"],
        ],
        group: ["productId"],
    });

    const newData = products.rows.map((item) => {
        const dataTotalSold = orderDetail.find((data) => data.dataValues.productId === item.id);
        const data = {
            ...item.dataValues,
            gameName: item.game.name,
            logoUrl: item.game.logoUrl,
            logoDenom: item.logoDenom || item.game.logoDenom || "",
            totalSold: dataTotalSold ? dataTotalSold.dataValues.totalSold : 0,
            game: undefined,
        };

        return data;
    });

    return res.send({
        data: newData,
        page: query.page,
        total: products.count,
        totalPage: Math.ceil(products.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });

    // if (column.length > 4) {
    //     const products = await productService.findManyByPagination(
    //         {
    //             column: column[0] as keyof ProductDto,
    //             value: `%${query[column[0]]}%`,
    //             operator: "like",
    //         },
    //         {
    //             page: query.page,
    //             sort: query.sort,
    //             order: query.order,
    //             limit: query.limit,
    //         },
    //         {
    //             column: "deleted",
    //             value: false,
    //         },
    //     );

    //     const productId = products.rows.map((product) => product.id);
    //     const orderDetail: { dataValues: { productId: string; totalSold: number } }[] = await orderDetailService.find({
    //         where: {
    //             productId,
    //         },
    //         attributes: [
    //             ["product_id", "productId"],
    //             [fn("SUM", col("quantity")), "totalSold"],
    //         ],
    //         group: ["productId"],
    //     });

    //     const gameId = products.rows.map((product) => product.gameId);

    //     const games = await gameService.findManyBy({
    //         column: "id",
    //         value: gameId,
    //         operator: "in",
    //         only: ["name", "id", "logoDenom", "logoUrl"],
    //     });

    //     const newData = [];
    //     for (const product of products.rows) {
    //         const game = games.find((game) => game.id === product.gameId);
    //         const dataTotalSold = orderDetail.find((data) => data.dataValues.productId === product.id);
    //         newData.push({
    //             ...product.dataValues,
    //             gameName: game.name || "",
    //             logoDenom: product.logoDenom || game.logoDenom || game.logoUrl || "",
    //             totalSold: dataTotalSold ? dataTotalSold.dataValues.totalSold : 0,
    //         });
    //     }

    //     return res.send({
    //         data: newData,
    //         page: query.page,
    //         total: products.count,
    //         totalPage: Math.ceil(products.count / query.limit),
    //         order: query.order,
    //         sort: query.sort,
    //         limit: query.limit,
    //     });
    // }

    // const products = await productService.findAllPagination(
    //     {
    //         page: query.page,
    //         sort: query.sort,
    //         order: query.order,
    //         limit: query.limit,
    //     },
    //     {
    //         column: "deleted",
    //         value: false,
    //     },
    // );
    // const productId = products.data.map((product) => product.id);
    // const orderDetail: { dataValues: { productId: string; totalSold: number } }[] = await orderDetailService.find({
    //     where: {
    //         productId,
    //     },
    //     attributes: [
    //         ["product_id", "productId"],
    //         [fn("SUM", col("quantity")), "totalSold"],
    //     ],
    //     group: ["productId"],
    // });

    // const gameId = products.data.map((product) => product.gameId);

    // const games = await gameService.findManyBy({
    //     column: "id",
    //     value: gameId,
    //     operator: "in",
    //     only: ["name", "id", "logoDenom", "logoUrl"],
    // });

    // const newData = [];
    // for (const product of products.data) {
    //     const game = games.find((game) => game.id === product.gameId);
    //     const dataTotalSold = orderDetail.find((data) => data.dataValues.productId === product.id);
    //     newData.push({
    //         ...product.dataValues,
    //         gameName: game.name || "",
    //         logoDenom: product.logoDenom || game.logoDenom || game.logoUrl || "",
    //         totalSold: dataTotalSold ? dataTotalSold.dataValues.totalSold : 0,
    //     });
    // }

    // return res.send({
    //     data: newData,
    //     page: query.page,
    //     total: products.total,
    //     totalPage: Math.ceil(products.total / query.limit),
    //     order: query.order,
    //     sort: query.sort,
    //     limit: query.limit,
    // });
};

export const getAllDenomPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
