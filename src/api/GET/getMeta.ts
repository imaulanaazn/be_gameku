import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { MetaService } from "@serviceInternal/meta.service";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { MetaDto } from "@dto/meta.dto";

const path = "/v1/meta";
const method = "GET";
const auth = "guess";

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
    if (!query.path) {
        const meta = await metaService.model.findAll({
            ...(query.only && { attributes: ["id", ...query.only.split(",")] }),
        });

        return res.send(meta);
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
