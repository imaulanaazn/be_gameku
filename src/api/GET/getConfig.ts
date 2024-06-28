import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ErrorStatusCode, ValidatorType } from "@enum/index";
import { Config } from "@config/index";
import { Validator } from "@helper/validator";
import { SysConfigEntity } from "@entity/sysConfig.entity";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod } from "@enum/index";

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
    const query = new Validator(req, res).process<{
        type: string;
        detail?: "true" | "false" | undefined;
    }>(schemaValidation, ValidatorType.QUERY);
    if (query.type === "webhook_key" || query.type === "api_key") {
        return res.sendStatus(200);
    }

    const sysConfigService = new SysConfigService();
    const type = query.type.split(",");
    const config = await sysConfigService.findManyBy({
        column: "cd",
        value: type,
        operator: "in",
    });

    if (query.detail === "true") {
        return res.send(config);
    }

    return res.send(
        config.map((item) => {
            return { value: item.value };
        }),
    );
};

export const getConfig: IApiRouter = {
    path,
    method,
    main,
    auth,
};
