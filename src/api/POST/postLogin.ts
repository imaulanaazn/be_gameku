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

const path = "/v1/customer/login";
const method = "POST";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "username",
        type: "string",
        required: true,
        errorMessage: "Email atau Nomor Whatsapp harus diisi",
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(body.username);

    const userService = new CustomerService();
    const config = new Config();

    let user: CustomerEntity;
    if (isEmail) {
        user = await userService.findUserWithPasswordBy("email", body.username);
    } else {
        const convertedNumber = body.username.replace(/^(\+62|62|0)?(\d+)/, "0$2");
        const isMobileNo = validator.isMobilePhone(convertedNumber, "id-ID");
        if (!isMobileNo) {
            throw new BusinessError("Format nomor whatsapp tidak valid", ErrorType.Validation);
        }

        user = await userService.findUserWithPasswordBy("mobileNumber", convertedNumber);
    }

    if (!user) {
        throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
    }

    const comparePassword = bcrypt.compareSync(body.password, user.password);
    if (!comparePassword) {
        throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
    }

    req.session.cookie.maxAge = config.maxAgeLogin * 1000;
    delete req.session.data;

    if (!req.session.data) {
        req.session.data = {
            roleId: user.roleId || config.roleUser,
            isLogin: true,
            ip: req.clientIp,
            userData: { ...user.dataValues, password: undefined },
        };
    }

    return res.send({
        ...user.dataValues,
        password: undefined,
    });
};

export const postLogin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
