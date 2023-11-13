import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { Config } from "@config/index";

const path = "/v1/admin/logout";
const method = "DELETE";
const auth = "admin";

const main: RequestHandler = async (req, res) => {
    res.clearCookie("session_gasskeun_admin", {
        httpOnly: true,
    });

    return res.sendStatus(200);
};

export const deleteLogoutAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
