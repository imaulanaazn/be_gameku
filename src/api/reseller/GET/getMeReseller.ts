import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/reseller/me";
const method = APIMethod.GET;
const auth = APIAuth.RESELLER;

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
