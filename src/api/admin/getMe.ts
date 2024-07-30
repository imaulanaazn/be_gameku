import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { Config } from "@config/index";
import * as jwt from "jsonwebtoken";
import { AdminDto } from "@dto/admin.dto";

const path = "/v1/me-admin";
const method = "GET";
const auth = "admin";

const main: RequestHandler = async (req, res) => {
    const session = req.admin.data;
    const config = new Config();
    return res.send({
        roleName: session.roleId === config.roleSuperAdmin ? "super-admin" : "admin",
        ...session,
    });
};

export const getMeAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
