import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ServerIdType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ProductService } from "@serviceInternal/product.service";
import { ProductEntity } from "@entity/product.entity";
import fetch from "node-fetch";
import { GameService } from "@serviceInternal/index";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductCategoryService } from "@serviceInternal/productCategory.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { Op } from "sequelize";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/reseller/products-grouped";
const method = APIMethod.GET;
const auth = APIAuth.RESELLER;

const schemaValidation: Validation[] = [
    {
        name: "slug",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        slug: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const productService = new ProductService();

    const gameService = new GameService();
    const game = await gameService.model.findOne({
        where: {
            slug: query.slug,
            deleted: false,
        },
        attributes: ["id", "categoryId", "name", "type", "needServerId", "typeServerId", "logoUrl", "description"],
    });

    if (!game) {
        throw new BusinessError("Slug Tidak valid", ErrorType.BadRequest);
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
                attributes: ["id", "name", "price", "logoDenom", "priceBuy"],
            },
        ],
    });

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
        attributes: ["id", "name", "price", "logoDenom", "priceBuy"],
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

    const sysConfigService = new SysConfigService();
    const discRessellerPermanent = await sysConfigService.findOneBy({
        column: "cd",
        value: "percentage_prices_reseller",
    });
    const discReseller = parseInt(discRessellerPermanent.value);
    const denom = products.map((item) => {
        const { resellerPrice, ...rest } = item.dataValues;
        if (!resellerPrice) {
            const disc = (rest.priceBuy * discReseller) / 100;
            return {
                ...rest,
                price: rest.priceBuy + disc,
            };
        } else {
            return { ...rest, price: resellerPrice };
        }
    });

    const newDataProductCategories = productCategories.map((item) => {
        const denoms = item.products.map((item) => {
            const { resellerPrice, ...rest } = item.dataValues;
            if (!resellerPrice) {
                const disc = (rest.priceBuy * discReseller) / 100;
                return {
                    ...rest,
                    price: rest.priceBuy + disc,
                };
            } else {
                return { ...rest, price: resellerPrice };
            }
        });

        denoms.sort((a, b) => a.price - b.price);
        delete item.products;
        return {
            ...item.dataValues,
            denoms,
        };
    });

    return res.send({
        ...game.dataValues,
        denoms: denom.sort((a, b) => a.price - b.price),
        listServer: listServers,
        groupedDenoms: newDataProductCategories,
        isGrouped,
    });
};

export const getDenomResellerByCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
