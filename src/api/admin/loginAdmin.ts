import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { Config } from "@config/index";
import { AdminService } from "@serviceInternal/admin.service";

const path = "/v1/admin/login";
const method = "POST";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "username",
        type: "string",
        required: true,
    },
    {
        name: "password",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        username: string;
        password: string;
    }>(schemaValidation, ValidatorType.BODY);

    const adminService = new AdminService();
    const config = new Config();
    const admin = await adminService.findUserWithAllAttr("username", body.username);

    if (!admin) {
        throw new BusinessError("Username atau Password tidak valid", ErrorType.BadRequest);
    }

    const comparePassword = bcrypt.compareSync(body.password, admin.password);
    if (!comparePassword) {
        throw new BusinessError("Username atau Password tidak valid", ErrorType.Validation);
    }

    req.session.cookie.maxAge = config.maxAgeLogin * 1000;
    delete req.session.data;

    if (!req.session.data) {
        req.session.data = {
            roleId: admin.role || config.roleAdmin,
            isLogin: true,
            ip: req.clientIp,
            userData: { ...admin.dataValues, password: undefined },
        };
    }

    return res.send({
        ...admin.dataValues,
        password: undefined,
    });
};

export const loginAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
