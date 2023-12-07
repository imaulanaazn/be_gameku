import { ErrorType, SysConfigCD, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { RequestHandler } from "express";
import fs from "fs";

const path = "/v1/whatsapp";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "content",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        content: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);

    const whatsappTemplateService = new WhatsappTemplateService();
    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!whatsappTemplate) {
        throw new BusinessError("ID Tidak valid silahkan coba lagi", ErrorType.BadRequest);
    }

    await whatsappTemplateService.updateBy({
        by: "id",
        value: body.id,
        data: {
            content: body.content,
        },
    });
    return res.sendStatus(200);
};

export const putTemplateWhatsapp: IApiRouter = {
    main,
    path,
    method,
    auth,
};
