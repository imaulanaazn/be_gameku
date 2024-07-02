import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ErrorStatusCode, ErrorType, ValidatorType } from "@enum/index";
import { Config } from "@config/index";
import { Validator } from "@helper/validator";
import { SysConfigEntity } from "@entity/sysConfig.entity";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod } from "@enum/index";
import Joi from "joi";
import { ValidatorV2 } from "@helper/validatorV2";
import mime from "mime";

const path = "/v1/get-image/:folder/:filename";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation = Joi.object({
    folder: Joi.string().required(),
    filename: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
    const param = new ValidatorV2(req, res).process<{
        folder: string;
        filename: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const di = req.di;
    const { folder, filename } = param;

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mimeType = mime.lookup(filename);
    if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
        res.status(415).send("Unsupported Media Type");
        return;
    }

    const getImage = await di.minioService.getFile({
        bucketName: "gasskeuntopup",
        filename: `${folder}/${filename}`,
        result: "buffer",
    });

    if (typeof getImage === "string") {
        throw new BusinessError(getImage, ErrorType.NotFound);
    }

    res.setHeader("Content-Type", mimeType);
    res.send(getImage);
    return;
};

export const getImage: IApiRouter = {
    path,
    method,
    main,
    auth,
};
