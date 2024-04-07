import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ServerIdType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";

const path = "/v1/game-detail";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: false,
    },
    {
        name: "slug",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        id: string;
        slug: string;
    }>(schemaValidation, ValidatorType.QUERY);

    if (!query.id && !query.slug) {
        throw new BusinessError(
            "Setidaknya query param harus ada salah satu dari game id atau game slug",
            ErrorType.Validation,
        );
    }

    const gameService = new GameService();
    const game = await gameService.model.findOne({
        where: {
            ...(query.id ? { id: query.id } : { slug: query.slug }),
            deleted: false,
        },
    });
    // const game = await gameService.findOneBy({
    //     column: query.id ? "id" : "slug",
    //     value: query.id || query.slug,
    // });

    if (!game) {
        throw new BusinessError(`Game tidak ditemukan dengan id: ${query.id}`, ErrorType.NotFound);
    }

    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            gameId: game.id,
            deleted: false,
            isActive: true,
        },
    });

    const listServerService = new ListServerService();
    let listServers;
    if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
        listServers = await listServerService.findManyBy({
            column: "gameId",
            value: game.id,
        });
    }

    const categoryId = products.map((item) => item.categoryId);
    const productCategoryService = new ProductCategoryService();
    let isGrouped = false;
    const productCategories = await productCategoryService.model.findAll({
        where: {
            id: categoryId,
        },
    });

    if (productCategories.length > 0) {
        isGrouped = true;
    }

    products.sort((a, b) => a.price - b.price);
    const newData = productCategories.map((category) => {
        const prods = products.filter((product) => product.categoryId === category.id);

        return {
            ...category.dataValues,
            denoms: prods,
        };
    });

    return res.send({
        ...game.dataValues,
        denoms: products,
        listServer: listServers,
        groupedDenoms: newData,
        isGrouped,
        products,
        servers: listServers,
    });

    res.send({
        ...game.dataValues,
        products,
        servers: listServers,
    });
};

export const getGameDetailById: IApiRouter = {
    main,
    path,
    method,
    auth,
};
