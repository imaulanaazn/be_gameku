import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ServerIdType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { ProductEntity } from "@entity/product.entity";
import { Op } from "sequelize";

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
        attributes: ["id", "categoryId", "name", "type", "needServerId", "typeServerId", "logoUrl", "description"],
    });

    if (!game) {
        throw new BusinessError(`Game tidak ditemukan dengan id: ${query.id}`, ErrorType.NotFound);
    }

    const productCategoryService = new ProductCategoryService();
    let isGrouped = false;
    const productCategories = await productCategoryService.model.findAll({
        where: {
            gameId: game.id,
        },
        order: [["catSequence", "ASC"]],
        attributes: ["id", "name", "catSequence"],
        include: [
            {
                model: ProductEntity,
                required: true,
                where: {
                    gameId: game.id,
                    deleted: false,
                    isActive: true,
                    isDisplayed: true,
                },
                attributes: ["id", "name", "price", "logoDenom"],
            },
        ],
    });

    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            gameId: game.id,
            deleted: false,
            isActive: true,
            isDisplayed: true,
            categoryId: {
                [Op.in]: ["", null],
            },
        },
        attributes: ["id", "name", "price", "logoDenom"],
    });

    if (productCategories.length > 0) {
        isGrouped = true;
        for (const product of products) {
            productCategories[0].products.push(product);
        }
    }

    const listServerService = new ListServerService();
    let listServers;
    if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
        listServers = await listServerService.model.findAll({
            where: {
                gameId: game.id,
            },
        });
    }

    const newDataProductCategories = productCategories.map((item) => {
        item.products.sort((a, b) => a.price - b.price);
        const denoms = item.products;
        delete item.products;
        return {
            ...item.dataValues,
            denoms,
        };
    });

    return res.send({
        ...game.dataValues,
        listServer: listServers,
        groupedDenoms: newDataProductCategories,
        isGrouped,
        products: products.sort((a, b) => a.price - b.price),
        denoms: products.sort((a, b) => a.price - b.price),
        servers: listServers,
    });
};

export const getGameDetailById: IApiRouter = {
    main,
    path,
    method,
    auth,
};
