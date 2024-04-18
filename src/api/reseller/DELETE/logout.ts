import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";

const path = "/v1/reseller/logout";
const method = "DELETE";
const auth = "reseller";

const main: RequestHandler = async (req, res) => {
    const reseller = req.reseller.data;
    res.clearCookie("session_gasskeun_reseller");
    return res.sendStatus(200);
};

export const deleteLogoutReseller: IApiRouter = {
    main,
    path,
    method,
    auth,
};
