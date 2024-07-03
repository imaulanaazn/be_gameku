import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { unlinkSync } from "fs";
import Joi from "joi";

const path = "/v1/delete-image/:folder/:filename";
const method = APIMethod.DELETE;
const auth = APIAuth.ALL_ADMIN;

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
    const getImage = await di.minioService.getFile({
        bucketName: "gasskeuntopup",
        filename: `${folder}/${filename}`,
        result: "buffer",
    });

    if (typeof getImage === "string") {
        throw new BusinessError(getImage, ErrorType.NotFound);
    }

    await di.minioService.deleteFile({
        filename: `${folder}/${filename}`,
        bucketName: "gasskeuntopup",
    });

    res.sendStatus(200);
};

export const deleteImage: IApiRouter = {
    path,
    method,
    main,
    auth,
};
