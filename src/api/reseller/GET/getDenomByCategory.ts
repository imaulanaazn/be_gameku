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

const path = "/v1/reseller/products-grouped";
const method = "GET";
const auth = "reseller";

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
    });

    if (!game) {
        throw new BusinessError("Slug Tidak valid", ErrorType.BadRequest);
    }

    const products = await productService.findDenomResellerPricesByGameId({ gameId: game.id });
    if (!products) {
        throw new BusinessError(`Produk tidak valid`, ErrorType.NotFound);
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

    denom.sort((a, b) => a.price - b.price);
    let listServer;
    if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
        const listServiceService = new ListServerService();
        listServer = await listServiceService.findManyBy({
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

    const newData = productCategories.map((category) => {
        const prods = denom.filter((product) => product.categoryId === category.id);

        return {
            ...category.dataValues,
            denoms: prods,
        };
    });

    return res.send({ ...game.dataValues, denoms: denom, listServer, groupedDenoms: newData, isGrouped });
};

export const getDenomResellerByCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
