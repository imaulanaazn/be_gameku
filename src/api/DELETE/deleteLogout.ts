import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { Config } from "@config/index";
import { CustomerEntity } from "@entity/customer.entity";
import validator from "validator";

const path = "/v1/customer/logout";
const method = "DELETE";
const auth = "user";

const main: RequestHandler = async (req, res) => {
    const config = new Config();
    req.session.regenerate((err) => {
        if (err) {
            console.log(err);
        } else {
            req.session.data = {
                roleId: config.roleUser,
                isLogin: false,
                ip: req.clientIp,
            };
        }
    });

    return res.sendStatus(200);
};

export const deleteLogout: IApiRouter = {
    path,
    method,
    main,
    auth,
};
