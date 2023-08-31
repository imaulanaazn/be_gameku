import { NextFunction, Request, RequestHandler, Response } from "express";
import { ErrorStatusCode, ErrorType } from "@enum/index";
import { Config } from "@config/index";
import { BusinessError } from "@helper/handleError";
import moment from "moment";

export const regenerateSession = (req: Request) => {
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
};

export const createSessions: RequestHandler = (req, res, next) => {
    const config = new Config();
    const session = req.session?.data;
    if (!session) {
        req.session.data = {
            roleId: config.roleUser,
            isLogin: false,
            ip: req.clientIp,
        };
    } else {
        if (session.isLogin === false) {
            const currentTime = moment();
            const sessionExpiration = moment(req.session.cookie.expires);

            const timeDiffInMinutes = sessionExpiration.diff(currentTime, "minutes");
            if (timeDiffInMinutes <= 5) {
                regenerateSession(req);
            }
        }
    }
    next();
};

export const authLoginUser: RequestHandler = (req, res, next) => {
    const session = req.session.data;
    if (!session || !session.isLogin) {
        return res.status(ErrorStatusCode.Authorization).send({
            errorCode: ErrorType.Authorization,
            message: "Cannot access to this resource",
        });
    }

    next();
};

export const authAdmin: RequestHandler = (req, res, next) => {
    const config = new Config();
    const session = req.session.data;
    if (!session || session.roleId !== config.roleAdmin) {
        return res.status(ErrorStatusCode.Authorization).send({
            errorCode: ErrorType.Authorization,
            message: "Cannot access to this resource",
        });
    }

    next();
};

export const authWehbookXendit: RequestHandler = (req, res, next) => {
    next();
};

export const authWehbookInternal: RequestHandler = (req, res, next) => {
    next();
};
