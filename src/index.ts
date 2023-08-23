import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import getApp from "./app";
import * as moment from "moment";
import "moment-timezone";

(async () => {
    try {
        if (process.env.NODE_ENV.toLowerCase() === "development") {
            console.log(process.env);
        }

        moment.tz.setDefault(process.env.TZ);
        const app: Express = express();
        const port = process.env.PORT || 3000;
        getApp(app);

        app.listen(port, () => {
            console.log(`⚡️[${process.env.NODE_ENV}]: Server is running at ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
})();
