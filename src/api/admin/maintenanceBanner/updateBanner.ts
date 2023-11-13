import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import fs from "fs";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Validator } from "@helper/validator";
import { BannerService } from "@serviceInternal/banner.service";
import { BannerDto } from "@dto/banner.dto";

const path = "/v1/banner";
const method = "PUT";
const auth = "admin";

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
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        name: string;
        eventUrl: string;
        external: boolean;
    }>(schemaValidation, ValidatorType.BODY);
    body["external"] = (body.external as any) === "true";

    const firebaseService = new FirebaseService();
    const bannerService = new BannerService();

    const banner = await bannerService.findOneBy({
        column: "id",
        value: body.id,
    });

    if (!banner) {
        throw new BusinessError("Banner tidak ditemukan dengan id " + body.id, ErrorType.BadRequest);
    }

    let dataUpdate: Partial<BannerDto> = {
        name: body.name,
        eventUrl: body.eventUrl,
        external: body.external,
        imageUrl: banner.imageUrl,
    };

    if (req.file) {
        const updateImg = await firebaseService.updateImg(
            req.file.path,
            banner.imageUrl,
            "banner/" + req.file.filename,
        );

        // fs.unlinkSync("uploads/" + req.file.filename);
        dataUpdate.imageUrl = updateImg;
    }

    const updateImg = await bannerService.updateBy({
        by: "id",
        value: body.id,
        data: dataUpdate,
    });

    res.send({
        id: banner.id,
        ...dataUpdate,
        createdAt: banner.createdAt,
    });
};

export const updateBanner: IApiRouter = {
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
