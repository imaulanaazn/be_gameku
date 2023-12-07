import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { VideoService } from "@serviceInternal/video.service";
import { BusinessError } from "@helper/handleError";
import { v4 as uuid } from "uuid";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { GameVoucherDto } from "@dto/gameVoucher.dto";

const path = "/v1/voucher-game";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "gameId",
        type: "string",
        required: true,
    },
    {
        name: "productId",
        type: "string",
        required: true,
    },
    {
        name: "code",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        gameId: string;
        productId: string;
        code: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    const gameVoucherService = new GameVoucherService();
    const voucher = await gameVoucherService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!voucher) {
        throw new BusinessError("Voucher tidak valid", ErrorType.BadRequest);
    }

    if (voucher.gameId !== body.gameId) {
        const gameService = new GameService();
        const game = await gameService.findOneBy({
            column: "id",
            value: body.gameId,
        });

        if (!game) {
            throw new BusinessError("Game tidak valid, silahkan refresh dan coba lagi", ErrorType.BadRequest);
        }
    }

    if (voucher.productId !== body.productId) {
        const productService = new ProductService();
        const product = await productService.findOneBy({
            column: "id",
            value: body.productId,
        });

        if (!product) {
            throw new BusinessError("Denom tidak valid, silahkan refresh dan coba lagi", ErrorType.BadRequest);
        }
    }

    const dataUpdate = {
        gameId: body.gameId,
        productId: body.productId,
        code: body.code,
    };

    await gameVoucherService.updateBy({
        by: "id",
        value: body.id,
        data: dataUpdate,
    });

    res.send({
        id: voucher.id,
        ...dataUpdate,
    });
};

export const putVoucherGame: IApiRouter = {
    path,
    method,
    main,
    auth,
};
