import { CheckGameAccount } from "@dto/apiGames.dto";
import { ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import generateSlug from "@helper/generateSlug";
import { sleep } from "@helper/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
// import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
// import { DigiflazzService } from "@serviceExternal/digiflazz.service";
// import { LapakGamingService } from "@serviceExternal/lapakgaming.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProviderService } from "@serviceInternal/provider.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/sync-desc-miraclegaming";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;
const main: RequestHandler = async (req, res) => {
  const gameService = new GameService();
  const games = await gameService.findAll();
  for (const game of games) {
    let desc = `<p>Cara Top Up ${game.name} di Topup Gameku :</p>\n<p><br /></p>`;

    if (game.type === "topup") {
      desc += `\n<p>1. Masukan User ID`;
      if (game.needServerId && game.typeServerId === ServerIdType.LIST) {
        desc += ` dan pilih Server ID</p>`;
      } else if (game.needServerId) {
        desc += ` dan server ID</p>`;
      } else {
        desc += `</p>`;
      }
    }

    desc += `<p>${
      game.type === "topup" ? "2" : "1"
    }. Pilih denom yang kamu inginkan</p>`;
    desc += `<p>${
      game.type === "topup" ? "3" : "2"
    }. Pilih nominal denom yang kamu inginkan</p>`;
    desc += `<p>${
      game.type === "topup" ? "4" : "3"
    }. Selesaikan pembayaran</p>`;

    if (game.type === "topup") {
      desc += `<p>5. Denom akan ditambahkan ke akun ${game.name} kamu</p>`;
    } else {
      desc += `<p>4. Voucher akan dikirim</p>`;
    }

    desc += `<p><br /></p>`;
    desc += `<p>Layanan 24 jam</p>`;
    desc += `<p>Pembayaran pake Qris lebih mudah &amp; lebih murah!</p>`;

    await gameService.updateBy({
      by: "id",
      value: game.id,
      data: {
        description: desc,
      },
    });

    await sleep(500);
  }

  res.sendStatus(200);
};

export const syncMiraclegamingDataDesc: IApiRouter = {
  method,
  path,
  auth,
  main,
};
