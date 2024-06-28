import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";

const path = "/v1/sosmed/:id";
const method = APIMethod.DELETE;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);

    const ids = body.id.split(",");

    const sosmedService = new SocialMediaService();
    const sosmed = await sosmedService.findManyBy({
        column: "id",
        value: ids,
        operator: "in",
    });

    if (sosmed.length === 0) {
        throw new BusinessError("Social Media tidak ditemukan dengan id " + body.id, ErrorType.BadRequest);
    }

    await sosmedService.deleteBy({
        by: "id",
        value: ids,
        operator: "in",
    });
    return res.sendStatus(200);
};

export const deleteSocialMedia: IApiRouter = {
    path,
    method,
    main,
    auth,
};
