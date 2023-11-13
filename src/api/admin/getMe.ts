import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ErrorStatusCode } from "@enum/index";
import { Config } from "@config/index";
import * as jwt from "jsonwebtoken";
import { AdminDto } from "@dto/admin.dto";

const path = "/v1/me-admin";
const method = "GET";
const auth = "admin";

const main: RequestHandler = async (req, res) => {
    const config = new Config();
    const session = req.cookies.session_gasskeun_admin;
    const decoded = jwt.verify(session, config.secretSessionAdmin) as AdminDto;

    return res.send({
        roleName: decoded.role === config.roleAdmin ? "admin" : "super-admin",
        ...decoded,
    });
};

export const getMeAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
