import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { RequestHandler } from "express";

const path = "/v1/game-voucher/:id";
const method = APIMethod.DELETE;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const gameVoucherId = param.id.split(",");

    const gameVoucherService = new GameVoucherService();
    await gameVoucherService.updateBy({
        by: "id",
        value: gameVoucherId,
        data: {
            deleted: true,
        },
    });

    // const gameService = new GameService();
    // await gameService.updateBy({
    //     by: "id",
    //     value: gameVoucherId,
    //     data: {
    //         deleted: true,
    //     },
    // });
    res.sendStatus(200);
};

export const deleteVoucherGame: IApiRouter = {
    path,
    method,
    main,
    auth,
};
