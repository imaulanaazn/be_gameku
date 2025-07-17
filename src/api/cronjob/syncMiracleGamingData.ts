import { CheckGameAccount } from "@dto/apiGames.dto";
import { ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import generateSlug from "@helper/generateSlug";
import { sleep } from "@helper/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
// import { CheckingGameIdService } from "@serviceExternal/codaShop.service";
// import { DigiflazzService } from "@serviceExternal/digiflazz.service";
import {
  IProductMiracleGaming,
  MiracleGamingService,
} from "@serviceExternal/miracleGaming.service";
import { GameService } from "@serviceInternal/game.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { ProductService } from "@serviceInternal/product.service";
import { ProviderService } from "@serviceInternal/provider.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/sync-product-miracle-gaming";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
  const sysConfigService = new SysConfigService();
  const providerService = new ProviderService();
  const productService = new ProductService();
  const gameService = new GameService();

  const sysConfig = await sysConfigService.findManyBy({
    column: "cd",
    value: ["api_key_miraclegaming", "percentage_prices"],
    operator: "in",
  });

  const provider = await providerService.findOneBy({
    column: "cd",
    value: "MIRACLE_GAMING",
  });

  const games = await gameService.findManyBy({
    column: "provider",
    value: provider.id,
  });

  const apiKey = sysConfig.find((item) => item.cd === "api_key_miraclegaming");
  const miraclegamingService = new MiracleGamingService(apiKey.value);
  const miraclegamingProducts = await miraclegamingService.getAllProducts();
  const dataProductsMiracleGaming = miraclegamingProducts.data;

  res.sendStatus(200);
  let count = 0;

  const groupedByKategori = dataProductsMiracleGaming.reduce((acc, item) => {
    if (!acc[item.kategori]) {
      acc[item.kategori] = [];
    }
    acc[item.kategori].push(item);
    return acc;
  }, {});

  const tasks: Promise<any>[] = [];

  for (const [kategori, products] of Object.entries(groupedByKategori) as [
    string,
    IProductMiracleGaming[]
  ][]) {
    const existingGame = games.find((g) => g.cd === generateCD(kategori));
    const gameId = existingGame ? existingGame.id : uuid();
    count++;

    if (!existingGame) {
      const gameCreatePromise = gameService.create({
        id: gameId,
        provider: provider.id,
        categoryId: "3478fb31-a9c0-42c1-ac17-7e8a5890b9d5",
        name: kategori,
        automatically: false,
        cd: generateCD(kategori),
        logoUrl: "",
        isPopular: false,
        slug: generateSlug(kategori),
        deleted: false,
        type: "topup",
        description: "",
        needServerId: false,
        needCheckId: false,
        typeServerId: ServerIdType.INPUT,
        voucherType: VoucherType.EXTERNAL,
      });

      tasks.push(gameCreatePromise);
    }

    const existingProductsPromise = productService.findManyBy({
      column: "gameId",
      value: gameId,
    });

    const task = existingProductsPromise.then(async (existingProducts) => {
      const newProducts: any[] = [];
      const updatePromises: Promise<any>[] = [];

      for (const product of products) {
        const matched = existingProducts.find((p) => p.code === product.id);

        const baseProduct = {
          id: uuid(),
          categoryId: "",
          name: product.nama_layanan,
          automatically: true,
          code: product.id,
          price: getUserPrices(product),
          resellerPrice: 10000000,
          priceBuy: parseInt(product.harga_pro.toString()),
          logoDenom: "",
          gameId: gameId,
          deleted: false,
          isActive: product.status === "aktif",
          isDisplayed: product.status === "aktif",
        };

        if (matched) {
          updatePromises.push(
            productService.updateBy({
              by: "id",
              value: matched.id,
              data: {
                price: baseProduct.price,
                priceBuy: baseProduct.priceBuy,
                isActive: baseProduct.isActive,
              },
            })
          );
        } else {
          newProducts.push(baseProduct);
        }
      }

      if (newProducts.length > 0) {
        await productService.model.bulkCreate(newProducts);
      }

      await Promise.all(updatePromises);
    });
    // for (const prod of prodsDb) {
    //   const prodLapak = allProductsFromLapakGaming.data.products.find(
    //     (item) => item.code === prod.code
    //   );
    //   if (prodLapak) {
    //     const userPrices = getUserPrices(prodLapak);
    //     await productService.updateBy({
    //       by: "id",
    //       value: prod.id,
    //       data: {
    //         price: userPrices,
    //         resellerPrice: 10000000, //Dummy value for now
    //         priceBuy: parseInt(prodLapak.price.toString()),
    //         isActive: prodLapak.status === "available" ? true : false,
    //       },
    //     });
    //   }
    // }
    tasks.push(task);
  }
  await Promise.all(tasks);
};

function generateCD(name: string): string {
  return generateSlug(name).toUpperCase();
}

function getUserPrices(item: IProductMiracleGaming) {
  const miracleGamingPrices = item.harga;
  let userPrices = 0;
  if (miracleGamingPrices < 50000) {
    userPrices = miracleGamingPrices - miracleGamingPrices * 0.02;
  } else if (miracleGamingPrices < 100000) {
    userPrices = miracleGamingPrices - miracleGamingPrices * 0.011;
  } else if (miracleGamingPrices < 250000) {
    userPrices = miracleGamingPrices - miracleGamingPrices * 0.008;
  } else {
    userPrices = miracleGamingPrices - miracleGamingPrices * 0.005;
  }
  return userPrices;
}

export const syncMiracleGamingData: IApiRouter = {
  method,
  path,
  auth,
  main,
};
