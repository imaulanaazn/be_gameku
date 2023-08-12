import { NextFunction, Request, Response } from "express";

const requestTime = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.originalUrl} -- start`);
    const startTime = new Date().getTime();
    res.on("finish", () => {
        const endTime = new Date().getTime();
        const requestTime = endTime - startTime;
        console.log(`[${res.statusCode}] ${req.method} ${req.originalUrl} - end [${requestTime}ms]`);
    });
    next();
};

export default requestTime;
