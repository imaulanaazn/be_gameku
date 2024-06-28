import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { APIAuth, APIMethod } from "@enum/index";
import { AdminRoleService } from "@serviceInternal/adminRole.service";

const path = "/v1/role";
const method = APIMethod.GET;
const auth = APIAuth.OWNER;

const main: RequestHandler = async (req, res) => {
    const roleService = new AdminRoleService();
    const roles = await roleService.model.findAll({
        attributes: ["id", "name", "cd"],
    });
    return res.send(roles);
};

export const getListRoles: IApiRouter = {
    path,
    method,
    main,
    auth,
};
