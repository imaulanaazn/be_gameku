import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";

const path = "/v1/customer/update";
const method = APIMethod.PUT;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "oldEmail",
        type: "string",
        required: false,
        isEmail: true,
    },
    {
        name: "newEmail",
        type: "string",
        required: false,
        isEmail: true,
    },
    {
        name: "oldPassword",
        type: "string",
        required: false,
    },
    {
        name: "newPassword",
        type: "string",
        required: false,
    },
    {
        name: "name",
        type: "string",
        required: false,
    },
];

const schemaValidationQuery: Validation[] = [
    {
        name: "type",
        type: "string",
        required: true,
        enum: ["password", "email", "name"],
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        id: string;
        oldEmail?: string;
        newEmail?: string;

        oldPassword?: string;
        newPassword?: string;

        name?: string;
    }>(schemaValidation, ValidatorType.BODY);

    const query = new Validator(req, res).process<{
        type: "password" | "email" | "name";
    }>(schemaValidationQuery, ValidatorType.QUERY);

    const customerService = new CustomerService();
    const customer = await customerService.model.scope("withPassword").findOne({
        where: {
            id: body.id,
            isActive: true,
        },
    });

    if (!customer) {
        throw new BusinessError("Customer tidak valid", ErrorType.BadRequest);
    }

    if (query.type === "email" && (!body.newEmail || !body.oldEmail)) {
        throw new BusinessError("Email harus diisi", ErrorType.Validation);
    } else if (query.type === "email") {
        if (customer.email !== body.oldEmail) {
            throw new BusinessError("Email lama tidak valid", ErrorType.BadRequest);
        }

        if (body.oldEmail === body.newEmail) {
            throw new BusinessError("Email lama dan email baru tidak boleh sama", ErrorType.BadRequest);
        }

        await customerService.updateBy({
            by: "id",
            value: body.id,
            data: {
                email: body.newEmail,
            },
        });

        return res.send({
            ...customer.dataValues,
            email: body.newEmail,
            password: undefined,
        });
    }

    if (query.type === "password" && (!body.newPassword || !body.oldPassword)) {
        throw new BusinessError("Password harus diisi", ErrorType.BadRequest);
    } else if (query.type === "password") {
        const comparePassword = bcrypt.compareSync(body.oldPassword, customer.password);
        if (!comparePassword) {
            throw new BusinessError("Password lama tidak valid", ErrorType.BadRequest);
        }
        if (body.oldPassword === body.newPassword) {
            throw new BusinessError("Password lama dan password baru tidak boleh sama", ErrorType.BadRequest);
        }

        const hash = bcrypt.hashSync(body.newPassword, 10);
        await customerService.updateBy({
            by: "id",
            value: body.id,
            data: {
                password: hash,
            },
        });

        return res.send({
            ...customer.dataValues,
            password: undefined,
        });
    }

    if (query.type === "name" && !body.name) {
        throw new BusinessError("Nama harus diisi", ErrorType.BadRequest);
    } else if (query.type === "name") {
        await customerService.updateBy({
            by: "id",
            value: body.id,
            data: {
                name: body.name,
            },
        });

        return res.send({
            ...customer.dataValues,
            password: undefined,
            name: body.name,
        });
    }
};

export const putCustomer: IApiRouter = {
    path,
    method,
    main,
    auth,
};
