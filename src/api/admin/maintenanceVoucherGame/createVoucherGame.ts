import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
// import { VideoService } from "@serviceInternal/video.service";
import { BusinessError } from "@helper/handleError";
import { v4 as uuid } from "uuid";
import { GameService } from "@serviceInternal/game.service";
import { ProductService } from "@serviceInternal/product.service";
import { GameVoucherService } from "@serviceInternal/gameVoucher.service";
import { GameVoucherDto } from "@dto/gameVoucher.dto";

const path = "/v1/voucher-game";
const method = APIMethod.POST;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
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
    gameId: string;
    productId: string;
    code: string;
  }>(schemaValidation, ValidatorType.BODY);
  console.log(body);
  const gameService = new GameService();
  const game = await gameService.findOneBy({
    column: "id",
    value: body.gameId,
  });

  if (!game) {
    throw new BusinessError(
      "Game tidak valid, silahkan refresh dan coba lagi",
      ErrorType.BadRequest
    );
  }

  const productService = new ProductService();
  const product = await productService.findOneBy({
    column: "id",
    value: body.productId,
  });

  if (!product) {
    throw new BusinessError(
      "Denom tidak valid, silahkan refresh dan coba lagi",
      ErrorType.BadRequest
    );
  }

  const vouchers = body.code.split("\n");
  if (vouchers.length === 0) {
    throw new BusinessError(
      "Tidak ada kode yang di input, silahkan coba lagi",
      ErrorType.Validation
    );
  }

  let dataBulk: GameVoucherDto[] = [];
  for (const voucher of vouchers) {
    dataBulk.push({
      id: uuid(),
      gameId: body.gameId,
      productId: body.productId,
      code: voucher,
      used: false,
      deleted: false,
    });
  }
  const gameVoucherService = new GameVoucherService();
  await gameVoucherService.model.bulkCreate(dataBulk);

  res.sendStatus(200);
};

export const createVoucherGame: IApiRouter = {
  path,
  method,
  main,
  auth,
};
