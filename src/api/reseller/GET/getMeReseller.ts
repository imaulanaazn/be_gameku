import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";

const path = "/v1/reseller/me";
const method = "GET";
const auth = "reseller";

const main: RequestHandler = async (req, res) => {
    const session = req.reseller.data;
    return res.send(session);
};

export const getMeReseller: IApiRouter = {
    path,
    method,
    main,
    auth,
};
