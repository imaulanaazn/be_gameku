import { APIAuth, APIMethod, ErrorType, SysConfigCD } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { IApiRouter } from "@interfaces/index";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { RequestHandler } from "express";

const path = "/v1/xendit";
const method = APIMethod.PUT;
const auth = APIAuth.ADMIN;

const main: RequestHandler = async (req, res) => {
    const body: {
        cd: string;
        value: string;
    }[] = req.body;
    console.log(body);

    if (body.length === 0) {
        throw new BusinessError("Data harus diisi", ErrorType.Validation);
    }

    const sysConfigService = new SysConfigService();

    for (const data of body) {
        if (!data.cd || !data.value) {
            throw new BusinessError("Data harus diisi", ErrorType.Validation);
        }

        if (data.cd !== SysConfigCD.XENDIT_SECRET_KEY && data.cd !== SysConfigCD.XENDIT_WEBHOOK_KEY) {
            throw new BusinessError("Data tidak valid", ErrorType.BadRequest);
        }

        await sysConfigService.updateBy({
            by: "cd",
            value: data.cd,
            data: {
                value: data.value,
            },
        });
    }

    return res.sendStatus(200);
};

export const putXenditConfig: IApiRouter = {
    main,
    path,
    method,
    auth,
};
