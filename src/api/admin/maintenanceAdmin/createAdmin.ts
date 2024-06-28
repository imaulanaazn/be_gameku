import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { AdminService } from "@serviceInternal/admin.service";
import bcrypt from "bcrypt";
import { Config } from "@config/index";
import { ValidatorV2 } from "@helper/validatorV2";
import Joi from "joi";
import { AdminRoleService } from "@serviceInternal/adminRole.service";
import { Op } from "sequelize";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { AdminUserRoleDto } from "@dto/AdminUserRole.dto";

const path = "/v1/admin/admin";
const method = APIMethod.POST;
const auth = APIAuth.OWNER;

const schemaValidation = Joi.object({
    name: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    roleIds: Joi.array().items(Joi.string()).required(),
});

const main: RequestHandler = async (req, res) => {
    const body = new ValidatorV2(req, res).process<{
        name: string;
        username: string;
        password: string;
        roleIds: string[];
    }>(schemaValidation, ValidatorType.BODY);

    const adminService = new AdminService();
    const usernameIsExist = await adminService.model.findOne({
        where: {
            username: body.username,
            deleted: false,
        },
    });

    if (usernameIsExist) {
        throw new BusinessError("Username sudah ada", ErrorType.Duplicate);
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

    const hash = bcrypt.hashSync(body.password, 10);
    const newData = await adminService.create({
        id: uuid(),
        name: body.name,
        username: body.username,
        password: hash,
        deleted: false,
    });

    const roleDatas = roles.map(
        (role) =>
            <AdminUserRoleDto>{
                id: uuid(),
                userId: newData.id,
                roleId: role.id,
            },
    );

    const userAdminRoleSevice = new AdminUserRoleService();
    await userAdminRoleSevice.model.bulkCreate(roleDatas);

    return res.sendStatus(200);
};

export const createAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
