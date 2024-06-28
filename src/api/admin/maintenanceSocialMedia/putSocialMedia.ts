import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { BusinessError } from "@helper/handleError";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";

const path = "/v1/sosmed";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "icon",
        type: "string",
        required: true,
    },
    {
        name: "url",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        name: string;
        icon: string;
        url: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    const sosmedService = new SocialMediaService();
    const checkData = await sosmedService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!checkData) {
        throw new BusinessError("Data tidak valid silahkan refresh dan coba lagi", ErrorType.BadRequest);
    }

    await sosmedService.updateBy({
        by: "id",
        value: body.id,
        data: {
            name: body.name,
            icon: body.icon,
            url: body.url,
        },
    });

    res.sendStatus(200);
};

export const putSocialMedia: IApiRouter = {
    path,
    method,
    main,
    auth,
};
