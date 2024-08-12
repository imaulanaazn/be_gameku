import { GameEntity } from "@entity/game.entity";
import { ProductEntity } from "@entity/product.entity";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/voucher-game";
const method = APIMethod.GET;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "code",
        type: "string",
        required: false,
    },
    {
        name: "used",
        type: "string",
        required: false,
        enum: ["true", "false"],
    },
    {
        name: "voucher",
        type: "string",
        required: false,
    },
    {
        name: "gameId",
        type: "string",
        required: false,
    },
    {
        name: "productId",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        code?: string;
        used?: "true" | "false";
        voucher?: string;
        gameId?: string;
        productId?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.used;
    delete clearQuery.start;
    delete clearQuery.end;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const voucherGame = new GameVoucherService();
    const column = Object.keys(query);
    const order: any =
        query.sort === "gameName"
            ? [[{ model: GameEntity, as: "game" }, "name", query.order]]
            : [[query.sort, query.order]];

    let where: any = {
        deleted: false,
    };
    if (column.length > 4) {
        if (query.used) {
            where.used = query.used === "true";
        }

        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const voucher = await voucherGame.model.findAndCountAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        include: [
            {
                model: GameEntity,
                required: true,
                attributes: ["id", "name", "logoUrl"],
            },
            {
                model: ProductEntity,
                required: true,
                attributes: ["id", "name", "gameId"],
            },
        ],
        order,
        ...(where && {
            where: {
                ...where,
            },
        }),
    });

    return res.send({
        data: voucher.rows,
        page: query.page,
        total: voucher.count,
        totalPage: Math.ceil(voucher.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllVoucherGamePagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
