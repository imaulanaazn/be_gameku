import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Validator } from "@helper/validator";
import { BannerService } from "@serviceInternal/banner.service";

const path = "/v1/banner/:id";
const method = "DELETE";
const auth = "admin";

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

    const firebaseService = new FirebaseService();
    const bannerService = new BannerService();

    const banners = await bannerService.findManyBy({
        column: "id",
        value: ids,
        operator: "in",
    });

    if (banners.length === 0) {
        throw new BusinessError("Banner tidak ditemukan dengan id " + body.id, ErrorType.BadRequest);
    }

    for (const banner of banners) {
        await firebaseService.deleteImg(banner.imageUrl);
    }

    await bannerService.deleteBy({
        by: "id",
        value: ids,
        operator: "in",
    });
    return res.sendStatus(200);
};

export const deleteBanner: IApiRouter = {
    path,
    method,
    main,
    auth,
};
