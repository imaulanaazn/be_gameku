import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { APIAuth, APIMethod } from "@enum/index";
import { selectFields } from "@helper/selectedField";
import { SysConfigDto } from "@dto/sysConfig.dto";

const path = "/v1/config";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
  {
    name: "type",
    required: true,
    type: "string",
  },
  {
    name: "detail",
    required: false,
    type: "string",
    enum: ["true", "false"],
  },
];

const main: RequestHandler = async (req, res) => {
  const di = req.di;
  const query = new Validator(req, res).process<{
    type: string;
    detail?: "true" | "false" | undefined;
  }>(schemaValidation, ValidatorType.QUERY);
  const notInclude = [
    "username_digiflazz",
    "api_key",
    "api_key_lapakgaming",
    "tokopay_merchant_id",
    "api_key_digiflazz",
    "kupon_apikey",
    "tokopay_secret_key",
    "api_games_merchant_id",
    "webhook_key",
    "api_games_secret_key",
  ];
  if (notInclude.includes(query.type)) {
    return res.send([]);
  }

  const sysConfigService = new SysConfigService();
  const type = query.type.split(",");
  let redisKey = "config";
  const isDetail = !!query.detail;

  const dataPromises = type.map(async (item) => {
    const redisItemKey = `${redisKey}${isDetail ? ":detail" : ""}:${item}`;
    const getData = await di.redisService.getObject<SysConfigDto>(redisItemKey);

    if (getData) {
      return getData;
    } else {
      const data = await sysConfigService.model.findOne({
        where: {
          cd: item,
        },
        attributes: isDetail ? undefined : ["value", "cd"],
      });

      if (data) {
        await di.redisService.setObject(redisItemKey, { value: data.value });
        return data;
      }

      return null;
    }
  });

  const allDataFromRedis = await Promise.all(dataPromises);
  return res.send(
    isDetail ? allDataFromRedis : selectFields(allDataFromRedis, ["value"])
  );
};

export const getConfig: IApiRouter = {
  path,
  method,
  main,
  auth,
};
