import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import util from "util";

const transport = new DailyRotateFile({
    filename: "logs/logger-management-gasskeuntopup %DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "100m",
    maxFiles: "5d",
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

console.log = function (...msg) {
    if (msg.length > 1) {
        for (const log of msg) {
            logger.info(log);
        }
    } else {
        logger.info(msg[0]);
    }
};

console.warn = function (...msg) {
    if (msg.length > 1) {
        for (const log of msg) {
            logger.warn(log);
        }
    } else {
        logger.warn(msg[0]);
    }
};

console.error = function (...msg) {
    if (msg.length > 1) {
        for (const log of msg) {
            logger.error(log);
        }
    } else {
        logger.error(msg);
    }
};
