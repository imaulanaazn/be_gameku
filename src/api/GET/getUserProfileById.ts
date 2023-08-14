import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";

const path = "/v1/customer/:id";
const method = "GET";
const auth = "user";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);
    const userService = new CustomerService();
    const user = await userService.findOneBy({
        column: "id",
        value: param.id,
    });

    if (!user) {
        throw new BusinessError("User tidak ditemukan", ErrorType.NotFound);
    }
    res.send(user);
};

export const getUserProfileById: IApiRouter = {
    path,
    method,
    main,
    auth,
};
