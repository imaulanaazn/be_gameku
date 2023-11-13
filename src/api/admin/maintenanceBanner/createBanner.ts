import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Validator } from "@helper/validator";
import { BannerService } from "@serviceInternal/banner.service";
import { v4 as uuid } from "uuid";

const path = "/v1/banner";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "eventUrl",
        type: "string",
        required: false,
        default: "#",
    },
    {
        name: "external",
        type: "string",
        required: false,
        enum: ["true", "false"],
        default: "false",
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        name: string;
        eventUrl: string;
        external: boolean;
    }>(schemaValidation, ValidatorType.BODY);
    body["external"] = (body.external as any) === "true";

    if (!req.file) {
        throw new BusinessError("Tidak ada file yang di upload", ErrorType.Validation);
    }

    const firebaseService = new FirebaseService();
    const bannerService = new BannerService();
    const upload = await firebaseService.uploadImg(req.file.path, "banner/" + req.file.filename);
    if (!upload) {
        throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
    }

    const newBanner = await bannerService.create({
        id: uuid(),
        name: body.name,
        eventUrl: body.eventUrl,
        external: body.external,
        imageUrl: upload,
    });
    res.send(newBanner);
};

export const createBanner: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        single: true,
        field: "bannerImage",
    },
};
