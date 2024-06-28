import { AdminMenuEntity } from "@entity/adminMenu.entity";
import { AdminMenuRoleEntity } from "@entity/adminMenuRole.entity";
import { AdminRoleEntity } from "@entity/adminRole.entity";
import { APIAuth, APIMethod } from "@enum/index";
import { IApiRouter } from "@interfaces/index";
import { AdminMenuService } from "@serviceInternal/adminMenu.service";
import { AdminMenuRoleService } from "@serviceInternal/adminMenuRole";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/admin-menu";
const method = APIMethod.GET;
const auth = APIAuth.ALL_ADMIN;

const main: RequestHandler = async (req, res) => {
    const admin = req.admin.data;
    console.log(admin);
    const adminUserRoleService = new AdminUserRoleService();
    const adminUserRole = await adminUserRoleService.model.findAll({
        where: {
            userId: admin.id,
        },
        attributes: ["roleId"],
        include: [
            {
                model: AdminRoleEntity,
                required: true,
                include: [
                    {
                        model: AdminMenuRoleEntity,
                        required: true,
                        include: [
                            {
                                model: AdminMenuEntity,
                                required: true,
                            },
                        ],
                    },
                ],
            },
        ],
    });

    const newData = adminUserRole
        .map((userRole) => {
            const menu = userRole.role.menuRoles.map((item) => ({
                title: item.menu.title,
                path: item.menu.path,
            }));

            return menu;
        })
        .flat()
        .sort((a, b) => a.title.localeCompare(b.title));

    res.send(newData);
};

export const getListAdminMenu: IApiRouter = {
    main,
    path,
    method,
    auth,
};
