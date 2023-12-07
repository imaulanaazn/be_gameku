import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";

const path = "/v1/sosmed";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
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
        name: string;
        icon: string;
        url: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);

    const socialMediaService = new SocialMediaService();
    const socialMedia = await socialMediaService.create({
        id: uuid(),
        name: body.name,
        icon: body.icon,
        url: body.url,
    });

    res.send(socialMedia);
};

export const createSocialMedia: IApiRouter = {
    path,
    method,
    main,
    auth,
};
