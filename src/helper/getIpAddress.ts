import { Request } from "express";

export const getIpAddress = (req: Request) => {
    const forwardedIpsStr = req.header("x-forwarded-for");
    if (forwardedIpsStr) {
        const forwardedIps = forwardedIpsStr.split(",");
        return forwardedIps[0];
    }
    return req.connection.remoteAddress;
};
