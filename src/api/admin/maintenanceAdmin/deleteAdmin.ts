import { Config } from "@config/index";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { AdminService } from "@serviceInternal/admin.service";
import { RequestHandler } from "express";

const path = "/v1/admin/admin";
const method = "DELETE";
const auth = "super-admin";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        id?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const adminService = new AdminService();
    const config = new Config();
    const admin = await adminService.findOneBy({
        column: "id",
        value: query.id,
    });

    if (!admin) {
        throw new BusinessError(`Admin tidak ditemukan dengan id ${query.id}`, ErrorType.BadRequest);
    }

    await adminService.deleteBy({
        by: "id",
        value: query.id,
    });

    return res.sendStatus(200);
};

export const deleteAdmin: IApiRouter = {
    main,
    path,
    method,
    auth,
};
