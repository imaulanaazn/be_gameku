import { GameEntity } from "@entity/game.entity";
import { ProviderEntity } from "@entity/provider.entity";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { KuponService } from "@serviceExternal/kupon.service";
import { LapakGamingService } from "@serviceExternal/lapakgaming.service";
import { ProductService } from "@serviceInternal/product.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/denom/archive";
const method = APIMethod.PUT;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "productId",
        type: "array",
        required: true,
        items: {
            name: "productId",
            type: "string",
            required: true,
        },
    },
    {
        name: "status",
        type: "string",
        required: true,
        enum: ["active", "archive"],
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        productId: string[];
        status: "active" | "archive";
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);

    const productService = new ProductService();
    const products = await productService.model.findAll({
        where: {
            id: {
                [Op.in]: body.productId,
            },
        },
        include: [
            {
                model: GameEntity,
                required: true,
                include: [
                    {
                        model: ProviderEntity,
                        required: true,
                    },
                ],
            },
        ],
    });

    if (body.status === "archive") {
        await productService.model.update(
            {
                isDisplayed: false,
            },
            {
                where: {
                    id: {
                        [Op.in]: body.productId,
                    },
                },
            },
        );

        res.sendStatus(200);
        return;
    }

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["api_key_lapakgaming", "kupon_apikey"],
        operator: "in",
    });

    const lapakGamingApiKey = sysConfig.find((item) => item.cd === "api_key_lapakgaming");
    const kuponApiKey = sysConfig.find((item) => item.cd === "kupon_apikey");
    const lapakgamingService = new LapakGamingService(lapakGamingApiKey.value);
    const kuponService = new KuponService(kuponApiKey.value);

    for (const product of products) {
        let isCanUpdate = false;
        if (product.game.gameProvider.cd === "LAPAK_GAMING") {
            const lapakGamingProducts = await lapakgamingService.getProductByGamesCode({
                gameCd: product.game.cd,
            });

            const findProduct = lapakGamingProducts.data.products.find((item) => item.code === product.code);
            console.log(findProduct);
            if (!findProduct || findProduct.status !== "available") {
                continue;
            }

            await productService.updateBy({
                by: "id",
                value: product.id,
                data: {
                    isDisplayed: true,
                },
            });
        } else if (product.game.gameProvider.cd === "KUPON") {
            const kuponProducts = await kuponService.getProductByGamesCode({
                gameCd: product.game.cd,
            });

            const findProduct = kuponProducts.data.products.find((item) => item.id.toString() === product.code);
            console.log(findProduct);
            if (!findProduct || !findProduct.isActive) {
                continue;
            }

            await productService.updateBy({
                by: "id",
                value: product.id,
                data: {
                    isDisplayed: true,
                },
            });
        }
    }

    res.sendStatus(200);
};

export const putArchiveProduct: IApiRouter = {
    path,
    method,
    main,
    auth,
};
