import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Config } from "@config/index";

const path = "/v1/customer/image";
const method = "PUT";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const file = req.file;
    const config = new Config();

    const customerService = new CustomerService();
    const customer = await customerService.model.scope("withPassword").findOne({
        where: {
            id: query.id,
            isActive: true,
        },
    });

    if (!customer) {
        throw new BusinessError("Customer tidak valid", ErrorType.BadRequest);
    }

    const firebaseService = new FirebaseService();

    let upload = null;
    if (file) {
        if (customer.image) {
            await firebaseService.deleteImg(customer.image);
        }

        upload = await firebaseService.uploadImg(file.path, "user/" + file.filename);
        console.log(upload);
    }

    const updateData = {
        image: upload,
    };

    req.session.cookie.maxAge = config.maxAgeLogin * 1000;
    delete req.session.data;

    if (!req.session.data) {
        req.session.data = {
            roleId: customer.roleId || config.roleUser,
            isLogin: true,
            ip: req.clientIp,
            userData: { ...customer.dataValues, password: undefined },
        };
    }

    await customerService.updateBy({
        by: "id",
        value: query.id,
        data: updateData,
    });

    return res.send({
        ...customer.dataValues,
        ...updateData,
    });
};

export const putCustomerImage: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        single: true,
        field: "image",
    },
};
