import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import RedisService from "@serviceExternal/externalRedis.service";
import { MetaService } from "@serviceInternal/meta.service";
import { MetaDto } from "@dto/meta.dto";
import dayjs from "dayjs";
import { selectFields } from "@helper/selectedField";

const path = "/v1/meta";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "path",
        type: "string",
        required: false,
    },
    {
        name: "only",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        path: string;
        only: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const redisService = new RedisService();
    const metaService = new MetaService();
    const dateNow = dayjs();

    const redisKey = `meta:${query.path}`;
    if (!query.path) {
        const allKeysFromRedis = await redisService.scanKeys(`meta:*`);
        if (allKeysFromRedis.length > 0) {
            const mappingData = allKeysFromRedis.map(async (item) => await redisService.getJson<MetaDto>(item));
            const allMetasFromRedis = await Promise.all(mappingData);
            const only: any = query.only && query.only.split(",");
            return res.send(query.only ? selectFields(allMetasFromRedis, ["id", ...only]) : allMetasFromRedis);
        }

        const meta = await metaService.model.findAll({
            ...(query.only && { attributes: ["id", ...query.only.split(",")] }),
        });

        const modifiedTitle = meta.map((item) => {
            if ("title" in item) {
                return {
                    ...item.dataValues,
                    title: `${item.title} ${dateNow.format("MMMM YYYY")}`,
                };
            }
            return item;
        });

        return res.send(modifiedTitle);
        if (!query.only) {
            const setToRedis = meta.map((data) => redisService.setJson(`meta:${data.path}`, data));
            Promise.all(setToRedis);
        }

        return res.send(meta);
    }

    const metaFromRedis = await redisService.getJson(redisKey);
    if (metaFromRedis) {
        return res.send(metaFromRedis);
    }

    const meta = await metaService.findOneBy({
        column: "path",
        value: query.path,
    });

    if (!meta) {
        throw new BusinessError("Data tidak valid", ErrorType.BadRequest);
    }
    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findOneBy({
        column: "cd",
        value: "logo",
    });

    await redisService.setJson(redisKey, meta);

    return res.send({
        ...meta.dataValues,
        title: `${meta.title} ${dateNow.format("MMMM YYYY")}`,
        icon: sysConfig.value,
        image: sysConfig.value,
    });
};

export const getMetaByPath: IApiRouter = {
    path,
    method,
    main,
    auth,
};
