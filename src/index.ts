import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import getApp from "./app";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import advanced from "dayjs/plugin/advancedFormat";
import http from "http";

(async () => {
    try {
        if (process.env.NODE_ENV.toLowerCase() === "development") {
            console.log(process.env);
        }
        dayjs.extend(utc);
        dayjs.extend(timezone);
        dayjs.extend(advanced);

        dayjs.tz.setDefault(process.env.TZ || "Asia/Jakarta");
        const e: Express = express();
        const app = http.createServer(e);
        const port = process.env.PORT || 3000;
        getApp(e, app);

        app.listen(port, () => {
            console.log(`⚡️[${process.env.NODE_ENV}]: Server is running at ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
})();
