import { Config } from "@config/index";
import { AdminDto } from "@dto/admin.dto";
import { AdminUserRoleEntity } from "@entity/AdminUserRole";
import { AdminEntity } from "@entity/admin.entity";
import { AdminRoleEntity } from "@entity/adminRole.entity";
import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { AdminService } from "@serviceInternal/admin.service";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { RequestHandler } from "express";
import { string } from "joi";
import { Op, WhereOptions } from "sequelize";

const path = "/v1/admin/admin";
const method = APIMethod.GET;
const auth = APIAuth.OWNER;

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: false,
    },
    {
        name: "roleIds",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
        roleIds?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.isPopular;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const adminService = new AdminService();
    const adminUserRole = new AdminUserRoleService();
    const column = Object.keys(query);

    const roleIds = query.roleIds ? query.roleIds.split(",") : [];
    let where: WhereOptions<AdminEntity> = {};
    let whereRoles: WhereOptions<AdminUserRoleEntity> = {};
    if (column.length > 4) {
        if (roleIds.length > 0) {
            whereRoles["id"] = { [Op.in]: roleIds };
        }

        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const admin = await adminService.model.findAll({
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        include: [
            {
                model: AdminUserRoleEntity,
                required: false,
                where: whereRoles,
                include: [
                    {
                        model: AdminRoleEntity,
                        required: false,
                    },
                ],
            },
        ],
        order: [["name", "ASC"]],
        where: {
            ...where,
            deleted: {
                [Op.or]: [null, false],
            },
        },
    });
    const newData = admin.map((item) => {
        const { id, name, username, ...data } = item;
        const roles = item.roles.map((role) => ({
            id: role.role.id,
            name: role.role.name,
            cd: role.role.cd,
        }));

        return {
            id,
            name,
            username,
            roles,
        };
    });

    const count = await adminService.model.count({
        where,
    });

    return res.send({
        data: newData,
        page: query.page,
        total: count,
        totalPage: Math.ceil(count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllAdminPagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
