import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { Config } from "@config/index";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/me";
const method = APIMethod.GET;
const auth = APIAuth.USER;

const main: RequestHandler = async (req, res) => {
    const sessions = req.session.data;
    if (!sessions.isLogin) {
        return res.sendStatus(ErrorStatusCode.Authorization);
    }

    const duplicateData = sessions.userData as any;
    const roleId = duplicateData.role || duplicateData.roleId;

    const config = new Config();

    let role = "guest";
    if (roleId === config.roleUser) {
        role = "user";
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
