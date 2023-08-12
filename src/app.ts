import "./database";
import "@helper/logger";
import { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { router, webhook } from "./api";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createSessions } from "@middleware/sessions";
import requestIp from "request-ip";
import { Config } from "./config";
import requestTime from "@middleware/requestTime";

const getApp = async (app: Application) => {
    const config = new Config();
    const allowOrigin = config.originCors.split(",");

    app.set("trust proxy", true);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        }),
    );

    app.use((req, res, next) => {
        const clientIp = requestIp.getClientIp(req);
        req.clientIp = clientIp;
        next();
    });

    app.use(
        session({
            name: "gasskeun_session",
            secret: config.secretSession,
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: process.env.NODE_ENV.toLowerCase() === "production" ? true : false,
                httpOnly: true,
                sameSite: true,
                maxAge: config.secretMaxAge,
            },
        }),
    );

    app.use(createSessions);
    app.use(cookieParser());
    app.use(requestTime);
    app.use(webhook);
    app.use(router);
    app.use("*", (req: Request, res: Response) => {
        res.status(404);
        res.send({
            time: new Date(),
            message: "Cannot find path " + req.originalUrl,
            method: req.method,
        });
    });
};

export default getApp;
