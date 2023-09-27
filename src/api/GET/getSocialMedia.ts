import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";

const path = "/v1/social-media";
const method = "GET";
const auth = "guess";

const main: RequestHandler = async (req, res) => {
    const socialMediaService = new SocialMediaService();
    const socialMedia = await socialMediaService.findAll();
    const data = socialMedia.map((data) => {
        return {
            title: data.name,
            to: data.url,
            icon: data.icon,
        };
    });
    res.send(data);
};

export const getSocialMedia: IApiRouter = {
    path,
    method,
    main,
    auth,
};
