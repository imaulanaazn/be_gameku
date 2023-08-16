import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";

const path = "/v1/customer";
const method = "GET";
const auth = "user";

const main: RequestHandler = async (req, res) => {
    const sessions = req.session.data;
    if (!sessions.isLogin) {
        return res.sendStatus(ErrorStatusCode.Authorization);
    }

    res.send(sessions.userData);
};

export const getUserProfile: IApiRouter = {
    path,
    method,
    main,
    auth,
};
