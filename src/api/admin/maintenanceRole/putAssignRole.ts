import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { v4 as uuid } from "uuid";
import { AdminService } from "@serviceInternal/admin.service";
import { ValidatorV2 } from "@helper/validatorV2";
import Joi from "joi";
import { AdminRoleService } from "@serviceInternal/adminRole.service";
import { Op } from "sequelize";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { AdminUserRoleDto } from "@dto/AdminUserRole.dto";

const path = "/v1/role";
const method = APIMethod.PUT;
const auth = APIAuth.OWNER;

const schemaValidation = Joi.object({
    adminId: Joi.string().required(),
    roleIds: Joi.array().items(Joi.string()).required(),
});

const main: RequestHandler = async (req, res) => {
    const body = new ValidatorV2(req, res).process<{
        adminId: string;
        roleIds: string[];
    }>(schemaValidation, ValidatorType.BODY);

    const adminService = new AdminService();
    const admin = await adminService.model.findOne({
        where: {
            id: body.adminId,
            deleted: false,
        },
    });

    if (!admin) {
        throw new BusinessError("Admin tidak ditemukan", ErrorType.BadRequest);
    }

    const roleService = new AdminRoleService();
    const roles = await roleService.model.findAll({
        where: {
            id: {
                [Op.in]: body.roleIds,
            },
        },
    });

    if (roles.length !== body.roleIds.length) {
        throw new BusinessError("Ada role yang tidak valid", ErrorType.BadRequest);
    }

    const userAdminRoleSevice = new AdminUserRoleService();
    await userAdminRoleSevice.deleteBy({
        by: "userId",
        value: admin.id,
    });

    const roleDatas = roles.map(
        (role) =>
            <AdminUserRoleDto>{
                id: uuid(),
                userId: admin.id,
                roleId: role.id,
            },
    );

    await userAdminRoleSevice.model.bulkCreate(roleDatas);

    return res.sendStatus(200);
};

export const putAssignRole: IApiRouter = {
    path,
    method,
    main,
    auth,
};
