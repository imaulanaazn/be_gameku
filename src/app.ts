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
import { Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";
import { WhatsAppService } from "@serviceExternal/whatsapp.service";
import routerIo from "./socketIo";

const getApp = async (app: Application, server: HttpServer<typeof IncomingMessage, typeof ServerResponse>) => {
    try {
        const io = new Server(server, {
            cors: {
                methods: ["GET", "POST"],
                origin(requestOrigin, callback) {
                    if (allowOrigin.includes(requestOrigin) || !requestOrigin) {
                        callback(null, true);
                    } else {
                        callback(new Error("Origin not allowed by CORS"));
                    }
                },
                credentials: true,
            },
        });

        let client;

        try {
            client = new WhatsAppService(io);
        } catch (error) {
            console.error("Error creating WhatsAppService:", error);
        }

        const config = new Config();
        const allowOrigin = config.originCors.split(",");

        const corsOptions = {
            origin: (origin, callback) => {
                if (allowOrigin.includes(origin) || !origin) {
                    callback(null, true);
                } else {
                    callback(new Error("Origin not allowed by CORS"));
                }
            },
            credentials: true,
        };

        app.set("trust proxy", true);
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cors(corsOptions));

        app.use((req, res, next) => {
            const clientIp = requestIp.getClientIp(req);
            req.clientIp = clientIp;
            next();
        });

        app.use((req: Request, res, next) => {
            req.io = io;
            req.client = client;
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
                    maxAge: config.maxAgeGuest * 1000,
                },
            }),
        );

        io.on("connection", (socket) => {
            routerIo(io, socket, client);
        });

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
    } catch (error) {
        console.error(error);
    }
};

export default getApp;
