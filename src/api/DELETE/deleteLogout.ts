import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { Config } from "@config/index";

const path = "/v1/customer/logout";
const method = "DELETE";
const auth = "user";

const main: RequestHandler = async (req, res) => {
    const config = new Config();
    req.session.regenerate((err) => {
        if (err) {
            console.log(err);
        } else {
            req.session.data = {
                roleId: config.roleUser,
                isLogin: false,
                ip: req.clientIp,
            };
        }
    });

    return res.sendStatus(200);
};

export const deleteLogout: IApiRouter = {
    path,
    method,
    main,
    auth,
};
