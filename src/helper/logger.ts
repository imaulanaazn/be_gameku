import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import util from "util";

const transport = new DailyRotateFile({
    filename: "logs/logger-management-gasskeuntopup %DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "100m",
    maxFiles: "30d",
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:sss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            if (typeof message === "object") {
                return `[${timestamp}] ${util.inspect(message, { depth: null })}`;
            }

            return `[${timestamp}] ${message}`;
        }),
    ),
    transports: [
        transport,
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.printf(({ timestamp, level, message }) => {
                    if (typeof message === "object") {
                        return `[${timestamp}] ${util.inspect(message, { depth: null, colors: true })}`;
                    }

                    return `[${timestamp}] ${message}`;
                }),
            ),
        }),
    ],
});

console.log = function (msg) {
    logger.info(msg);
};

console.warn = function (msg) {
    logger.warn(msg);
};

console.error = function (msg) {
    logger.error(msg);
};
