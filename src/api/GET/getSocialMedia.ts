import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { SocialMediaService } from "@serviceInternal/socialMedia.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/social-media";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
