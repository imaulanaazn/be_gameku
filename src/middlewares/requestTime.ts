import { createLogCronjob, createLogWebhook } from "@helper/logger";
import { NextFunction, Request, Response } from "express";

const webhookEndpoint = ["/api/v1/webhook/lapakgaming-product"];
const cronjobEndpoint = ["/api/v1/sync-product-lapakgaming"];

const requestTime = (req: Request, res: Response, next: NextFunction) => {
    const messageStart = `${req.method} ${req.originalUrl} -- start`;
    if (webhookEndpoint.includes(req.originalUrl)) {
        createLogWebhook().log(messageStart);
    } else if (cronjobEndpoint.includes(req.originalUrl)) {
        createLogCronjob().log(messageStart);
    } else {
        console.log(messageStart);
    }

    const startTime = new Date().getTime();
    res.on("finish", () => {
        const endTime = new Date().getTime();
        const requestTime = endTime - startTime;
        const messageFinish = `[${res.statusCode}] ${req.method} ${req.originalUrl} - end [${requestTime}ms]`;
        if (webhookEndpoint.includes(req.originalUrl)) {
            createLogWebhook().log(messageFinish);
        } else if (cronjobEndpoint.includes(req.originalUrl)) {
            createLogCronjob().log(messageFinish);
        } else {
            console.log(messageFinish);
        }
    });
    next();
};

export default requestTime;
