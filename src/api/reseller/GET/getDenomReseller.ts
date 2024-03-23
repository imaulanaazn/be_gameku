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
import { SysConfigService } from "@serviceInternal/sysConfig.service";

const path = "/v1/reseller/products";
const method = "GET";
const auth = "reseller";

const schemaValidation: Validation[] = [
    {
        name: "productId",
        type: "string",
        required: false,
    },
    {
        name: "gameId",
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
        productId: string;
        gameId: string;
        slug: string;
    }>(schemaValidation, ValidatorType.QUERY);

    if (!query.gameId && !query.productId && !query.slug) {
        throw new BusinessError(
            "Setidaknya query param harus ada salah satu dari product ID atau game ID",
            ErrorType.Validation,
        );
    }

    const productService = new ProductService();

    if (query.gameId) {
        let products = await productService.findDenomResellerPricesByGameId({ gameId: query.gameId });

        if (!products) {
            throw new BusinessError(
                `Produk tidak valid ${query.gameId && query.gameId} | ${query.productId && query.productId}`,
                ErrorType.NotFound,
            );
        }

        const sysConfigService = new SysConfigService();
        const discRessellerPermanent = await sysConfigService.findOneBy({
            column: "cd",
            value: "disc_reseller",
        });
        const discReseller = parseInt(discRessellerPermanent.value);

        const denom = products.map((item) => {
            const { resellerPrice, ...rest } = item.dataValues;
            if (!resellerPrice) {
                const disc = (rest.price * discReseller) / 100;
                return {
                    ...rest,
                    price: rest.price - disc,
                };
            } else {
                return { ...rest, price: resellerPrice };
            }
        });
        return res.send(denom);
    } else if (query.productId) {
        let products = await productService.findOneDenomResellerById(query.productId);

        if (!products) {
            throw new BusinessError(
                `Produk tidak valid ${query.gameId && query.gameId} | ${query.productId && query.productId}`,
                ErrorType.NotFound,
            );
        }

        const sysConfigService = new SysConfigService();
        const discRessellerPermanent = await sysConfigService.findOneBy({
            column: "cd",
            value: "disc_reseller",
        });
        const discReseller = parseInt(discRessellerPermanent.value);

        let prices = products.resellerPrice;
        if (!products.resellerPrice) {
            const disc = (products.resellerPrice * discReseller) / 100;
            prices = products.resellerPrice - disc;
        }

        return res.send({ ...products.dataValues, price: prices });
    } else {
        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "slug",
            value: query.slug,
        });

        if (!game) {
            throw new BusinessError("Slug Tidak valid", ErrorType.BadRequest);
        }

        const products = await productService.findDenomResellerPricesByGameId({ gameId: game.id });

        if (!products) {
            throw new BusinessError(
                `Produk tidak valid ${query.gameId && query.gameId} | ${query.productId && query.productId}`,
                ErrorType.NotFound,
            );
        }

        const sysConfigService = new SysConfigService();
        const discRessellerPermanent = await sysConfigService.findOneBy({
            column: "cd",
            value: "disc_reseller",
        });
        const discReseller = parseInt(discRessellerPermanent.value);

        const denom = products.map((item) => {
            const { resellerPrice, ...rest } = item.dataValues;
            if (!resellerPrice) {
                const disc = (rest.price * discReseller) / 100;
                return {
                    ...rest,
                    price: rest.price - disc,
                };
            } else {
                return { ...rest, price: resellerPrice };
            }
        });

        let listServer;
        if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
            const listServiceService = new ListServerService();
            listServer = await listServiceService.findManyBy({
                column: "gameId",
                value: game.id,
            });
        }
        return res.send({ ...game.dataValues, denoms: denom, listServer });
    }
};

export const getDenomReseller: IApiRouter = {
    main,
    path,
    method,
    auth,
};
