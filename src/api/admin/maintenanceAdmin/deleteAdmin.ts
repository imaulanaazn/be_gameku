import { Config } from "@config/index";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { AdminService } from "@serviceInternal/admin.service";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { RequestHandler } from "express";

const path = "/v1/admin/admin";
const method = APIMethod.DELETE;
const auth = APIAuth.OWNER;

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
    const admin = await adminService.findOneBy({
        column: "id",
        value: query.id,
    });

    if (!admin) {
        throw new BusinessError(`Admin tidak ditemukan dengan id ${query.id}`, ErrorType.BadRequest);
    }

    const adminUserRolesService = new AdminUserRoleService();
    const adminUserRoles = await adminUserRolesService.model.findAll({
        where: {
            userId: admin.id,
        },
    });

    if (adminUserRoles.length > 0) {
        await adminUserRolesService.deleteBy({
            by: "userId",
            value: admin.id,
        });
    }

    await adminService.updateBy({
        by: "id",
        value: admin.id,
        data: {
            deleted: true,
        },
    });
    return res.sendStatus(200);
};

export const deleteAdmin: IApiRouter = {
    main,
    path,
    method,
    auth,
};
