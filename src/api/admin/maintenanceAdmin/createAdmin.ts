import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { BusinessError } from "@helper/handleError";
import { ErrorType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { v4 as uuid } from "uuid";
import { AdminService } from "@serviceInternal/admin.service";
import bcrypt from "bcrypt";
import { Config } from "@config/index";

const path = "/v1/admin/admin";
const method = "POST";
const auth = "super-admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
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
        name: string;
        username: string;
        password: string;
    }>(schemaValidation, ValidatorType.BODY);

    const adminService = new AdminService();
    const config = new Config();
    const usernameIsExist = await adminService.findOneBy({
        column: "username",
        value: body.username,
    });

    if (usernameIsExist) {
        throw new BusinessError("Username sudah ada", ErrorType.Duplicate);
    }

    const hash = bcrypt.hashSync(body.password, 10);
    const newData = await adminService.create({
        id: uuid(),
        name: body.name,
        role: config.roleAdmin,
        username: body.username,
        password: hash,
    });

    return res.send(newData);
};

export const createAdmin: IApiRouter = {
    path,
    method,
    main,
    auth,
};
