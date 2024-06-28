import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Validator } from "@helper/validator";
import { BannerService } from "@serviceInternal/banner.service";

const path = "/v1/banner/:id";
const method = APIMethod.GET;
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

    const firebaseService = new FirebaseService();
    const bannerService = new BannerService();

    const banner = await bannerService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!banner) {
        throw new BusinessError("Banner tidak ditemukan dengan id " + body.id, ErrorType.BadRequest);
    }

    return res.send(banner);
};

export const getBannerById: IApiRouter = {
    path,
    method,
    main,
    auth,
};
