import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { RequestHandler } from "express";

const path = "/v1/denom/attr";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "only",
        type: "string",
        required: false,
        default: "id,name",
    },
    {
        name: "conditional",
        type: "string",
        required: false,
    },
    {
        name: "isVoucherInternal",
        type: "string",
        required: false,
        enum: ["true", "false"],
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        only?: string;
        conditional?: string;
        isVoucherInternal?: "true" | "false";
    }>(schemaValidation, ValidatorType.QUERY);

    let game = [];
    if (query.isVoucherInternal && query.isVoucherInternal === "true") {
        const gameService = new GameService();
        game = await gameService.model.findAll({
            where: {
                deleted: false,
                voucherType: "internal",
            },
        });
    }
    const only = query.only.split(",");
    const productService = new ProductService();
    let where = {
        deleted: false,
        ...(game.length > 0 && { gameId: game.map((item) => item.id) }),
    };
    if (query.conditional) {
        const data = query.conditional.split(":");
        where = {
            ...where,
            [data[0]]: data[1],
        };
    }
    const games = await productService.find({
        where,
        attributes: only,
    });
    return res.send(games);
};

export const getAllDenomOnlyAttr: IApiRouter = {
    main,
    path,
    method,
    auth,
};
