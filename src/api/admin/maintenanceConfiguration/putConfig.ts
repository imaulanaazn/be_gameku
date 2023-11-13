import { ErrorType, SysConfigCD, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";

const path = "/v1/config";
const method = "PUT";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "type",
        required: true,
        type: "string",
        enum: ["logo", "bg_login", "bg_register", "bg_checkorder", "website_status", "bg_profile", "logo_footer"],
    },
    {
        name: "value",
        required: false,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        type: "logo" | "bg_login" | "bg_register" | "bg_checkorder" | "website_status" | "bg_profile" | "logo_footer";
        value: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const sysConfigService = new SysConfigService();
    const config = await sysConfigService.findOneBy({
        column: "cd",
        value: query.type,
    });

    if (!config) {
        return res.sendStatus(200);
    }

    if (
        query.type === "logo" ||
        query.type === "bg_login" ||
        query.type === "bg_register" ||
        query.type === "bg_checkorder" ||
        query.type === "bg_profile" ||
        query.type === "logo_footer"
    ) {
        if (!req.file) {
            throw new BusinessError("Tidak ada file yang di upload", ErrorType.BadRequest);
        }

        const firebaseService = new FirebaseService();
        const upload = await firebaseService.uploadImg(req.file.path, "config/" + req.file.filename);
        if (!upload) {
            throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
        }

        const data = {
            value: upload,
        };

        if (config) {
            firebaseService.deleteImg(config.value);
        }

        await sysConfigService.updateBy({
            by: "cd",
            value: query.type,
            data: {
                value: upload,
            },
        });

        return res.send(data);
    }

    if (!query.value) {
        throw new BusinessError("Value tidak valid", ErrorType.BadRequest);
    }

    await sysConfigService.updateBy({
        by: "cd",
        value: query.type,
        data: {
            value: query.value,
        },
    });

    return res.sendStatus(200);
};

export const putConfig: IApiRouter = {
    main,
    path,
    method,
    auth,
    isUploadImage: true,
    dataImg: {
        field: "logo",
        single: true,
    },
};
