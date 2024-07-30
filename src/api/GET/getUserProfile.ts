import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { Config } from "@config/index";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/me";
const method = APIMethod.GET;
const auth = APIAuth.USER;

const main: RequestHandler = async (req, res) => {
    const session = req.user.data;
    return res.send(session);
};

export const getUserProfile: IApiRouter = {
    path,
    method,
    main,
    auth,
};
