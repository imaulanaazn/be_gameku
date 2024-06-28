import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { MetaService } from "@serviceInternal/meta.service";
import { Validator } from "@helper/validator";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { MetaDto } from "@dto/meta.dto";
import dayjs from "dayjs";

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
    const metaService = new MetaService();
    const dateNow = dayjs();
    if (!query.path) {
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
