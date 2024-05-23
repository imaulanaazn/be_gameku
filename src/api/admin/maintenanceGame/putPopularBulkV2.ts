import { ValidatorType } from "@enum/index";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { RequestHandler } from "express";
import Joi from "joi";
import { Op } from "sequelize";

const path = "/v2/game/popular-bulk";
const method = "POST";
const auth = "admin";

const schemaValidation = Joi.array().items({
    gameId: Joi.string().required(),
    order: Joi.number().required(),
});

const main: RequestHandler = async (req, res) => {
    const body = new ValidatorV2(req, res).process<
        {
            gameId: string;
            order: number;
        }[]
    >(schemaValidation, ValidatorType.BODY);

    const gameService = new GameService();
    const gamesWithPopular = await gameService.model.findAll({
        where: {
            isPopular: true,
        },
        attributes: ["id"],
    });

    if (gamesWithPopular.length > 0) {
        const gameIds = gamesWithPopular.map((item) => item.id);
        await gameService.model.update(
            {
                isPopular: false,
            },
            {
                where: {
                    id: {
                        [Op.in]: gameIds,
                    },
                },
            },
        );
    }

    for (const data of body) {
        await gameService.model.update(
            {
                isPopular: true,
                popSequence: data.order,
            },
            {
                where: {
                    id: data.gameId,
                },
            },
        );
    }

    res.sendStatus(200);
};

export const putPopularBulkV2: IApiRouter = {
    path,
    method,
    main,
    auth,
};
