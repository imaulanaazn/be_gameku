import * as crypto from "crypto";
import { NextFunction, Request, Response, RequestHandler } from "express";
import { ErrorStatusCode, ErrorType } from "@enum/index";
import { Config } from "@config/index";
import moment from "moment";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import * as jwt from "jsonwebtoken";
import { AdminDto } from "@dto/admin.dto";
import { EncryptionService } from "@serviceInternal/jose.service";
import { CustomerDto } from "@dto/customer.dto";

const config = new Config();

export const regenerateSession = (req: Request) => {
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
};

export const createSessions: RequestHandler = (req, res, next) => {
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
    const session = req.cookies.session_gasskeun_admin;
    console.log(session);
    try {
        const decoded = jwt.verify(session, config.secretSessionAdmin) as AdminDto;
        if (decoded.role === config.roleAdmin || decoded.role === config.roleSuperAdmin) {
            next();
        } else {
            res.clearCookie("session_gasskeun_admin");
            return res.status(ErrorStatusCode.Authorization).send({
                errorCode: ErrorType.Authorization,
                message: "Cannot access to this resource",
            });
        }
    } catch (error) {
        console.error(error);
        res.clearCookie("session_gasskeun_admin");
        return res.status(ErrorStatusCode.Authorization).send({
            errorCode: ErrorType.Authorization,
            message: "Cannot access to this resource",
        });
    }
};

export const authReseller: RequestHandler = async (req, res, next) => {
    const encryptService = new EncryptionService();
    const session = req.cookies.session_gasskeun_reseller;
    console.log(session);
    try {
        const decode = await encryptService.decryptData<CustomerDto>(session);
        if (decode.isExpired) {
            res.clearCookie("session_gasskeun_reseller");
            return res.status(ErrorStatusCode.Authorization).send({
                errorCode: ErrorType.Authorization,
                message: "Cannot access to this resource",
            });
        }

        req.reseller = decode;

        next();
    } catch (error) {
        console.error(error);
        res.clearCookie("session_gasskeun_reseller");
        return res.status(ErrorStatusCode.Authorization).send({
            errorCode: ErrorType.Authorization,
            message: "Cannot access to this resource",
        });
    }
};

export const authSuperAdmin: RequestHandler = (req, res, next) => {
    const session = req.cookies.session_gasskeun_admin;
    try {
        const decoded = jwt.verify(session, config.secretSessionAdmin) as AdminDto;
        if (decoded.role === config.roleSuperAdmin) {
            next();
        } else {
            res.clearCookie("session_gasskeun_admin");
            return res.status(ErrorStatusCode.Authorization).send({
                errorCode: ErrorType.Authorization,
                message: "Cannot access to this resource",
            });
        }
    } catch (error) {
        res.clearCookie("session_gasskeun_admin");
        return res.status(ErrorStatusCode.Authorization).send({
            errorCode: ErrorType.Authorization,
            message: "Cannot access to this resource",
        });
    }
};

export const authWehbookXendit: RequestHandler = async (req, res, next) => {
    const callbackToken = req.headers["x-callback-token"];
    if (callbackToken) {
        const sysConfigService = new SysConfigService();
        const sysConfig = await sysConfigService.findOneBy({
            column: "cd",
            value: "webhook_key",
        });

        if (callbackToken === sysConfig.value) {
            next();
        } else {
            return res.sendStatus(403);
        }
    } else {
        return res.sendStatus(403);
    }
};

export const authWehbookAPIGames: RequestHandler = async (req, res, next) => {
    const callbackToken = req.headers["x-apigames-authorization"];
    if (callbackToken) {
        const sysConfigService = new SysConfigService();
        const configApiGames = await sysConfigService.findManyBy({
            column: "cd",
            value: ["api_games_merchant_id", "api_games_secret_key"],
            operator: "in",
        });
        const merchantId = configApiGames.find((item) => item.cd === "api_games_merchant_id");
        const secretKey = configApiGames.find((item) => item.cd === "api_games_secret_key");
        const signature = crypto
            .createHash("md5")
            .update(`${merchantId}:${secretKey}:${req.body.ref_id}`)
            .digest("hex");
        console.log(callbackToken);
        console.log(signature);
        console.log(req.body);
        next();
        // if (callbackToken === signature) {
        //     next();
        // } else {
        //     return res.sendStatus(403);
        // }
    } else {
        return res.sendStatus(403);
    }
};

export const authWehbookInternal = (req: Request, res: Response, next: NextFunction) => (xApiKey: string) => {
    const headerApiKey = req.headers["x-gasskeun-key"];
    if (xApiKey === headerApiKey) {
        next();
        return;
    } else {
        res.sendStatus(403);
        return;
    }
};

export const authWebhookDigiflazz: RequestHandler = (req, res, next) => {
    const remoteAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress;
    const config = new Config();
    if (remoteAddr === config.digiflazzIp) {
        next();
    } else {
        res.sendStatus(403);
        return;
    }
};

export const authWebhookLapakgaming: RequestHandler = (req, res, next) => {
    const remoteAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress;
    const config = new Config();
    if (remoteAddr === config.lapakGamingIP) {
        next();
    } else {
        res.sendStatus(403);
        return;
    }
};

export const resellerChecking: RequestHandler = async (req, res, next) => {
    const encryptService = new EncryptionService();
    const session = req.cookies.session_gasskeun_reseller;
    try {
        const decode = await encryptService.decryptData(session);
        req.isReseller = true;
        next();
    } catch (error) {
        console.log(error);
        req.isReseller = false;
        next();
    }
};
