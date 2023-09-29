import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { Config } from "@config/index";

const path = "/v1/me";
const method = "GET";
const auth = "user";

const main: RequestHandler = async (req, res) => {
    const sessions = req.session.data;
    if (!sessions.isLogin) {
        return res.sendStatus(ErrorStatusCode.Authorization);
    }
    const duplicateData = sessions.userData as any;
    const roleId = duplicateData.role || duplicateData.roleId;

    const config = new Config();

    let role = "guest";
    if (roleId === config.roleAdmin) {
        role = "admin";
    } else if (roleId === config.roleSuperAdmin) {
        role = "super-admin";
    } else if (roleId === config.roleUser) {
        role = "user";
    } else {
        role = "guest";
    }

    res.send({
        roleName: role,
        ...sessions.userData,
    });
};

export const getUserProfile: IApiRouter = {
    path,
    method,
    main,
    auth,
};
