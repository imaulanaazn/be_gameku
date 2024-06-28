import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { Config } from "@config/index";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/customer/logout";
const method = APIMethod.DELETE;
const auth = APIAuth.USER;

const main: RequestHandler = async (req, res) => {
    const config = new Config();
    req.session.regenerate((err) => {
        if (err) {
            console.error(err);
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
