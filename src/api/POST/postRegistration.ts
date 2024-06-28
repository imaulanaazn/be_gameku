import { APIAuth, APIMethod, ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { CustomerDto } from "@dto/customer.dto";
import { Config } from "@config/index";
import { v4 as uuid } from "uuid";
import moment from "moment";
import { CustomerEntity } from "@entity/customer.entity";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import dayjs from "dayjs";

const path = "/v1/customer/registration";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
    {
        name: "email",
        type: "string",
        required: true,
        isEmail: true,
    },
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "mobileNumber",
        type: "string",
        required: true,
        isMobileNo: true,
    },
    {
        name: "password",
        type: "string",
        required: true,
    },
    {
        name: "otp",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        email: string;
        name: string;
        mobileNumber: string;
        password: string;
        otp: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    console.log(req.headers["x-forwarded-for"]);
    const io = req.io;

    const otpService = new CustomerOtpService();
    const otp = await otpService.model.findOne({
        where: {
            mobileNumber: body.mobileNumber,
            type: "register",
        },
    });

    if (!otp) {
        throw new BusinessError("Silahkan coba beberapa saat lagi, dan coba lagi", ErrorType.BadRequest);
    }

    const isExpired = dayjs(dayjs(otp.expiredAt)).isBefore(dayjs());
    if (isExpired) {
        throw new BusinessError("Otp sudah kadaluarsa", ErrorType.BadRequest);
    }

    if (otp.otp !== body.otp) {
        throw new BusinessError("Otp tidak valid", ErrorType.BadRequest);
    }

    const userService = new CustomerService();
    const config = new Config();

    const userByEmail = await userService.findOneBy({
        column: "email",
        value: body.email,
    });

    if (userByEmail) {
        throw new BusinessError("Email sudah terdaftar", ErrorType.Duplicate);
    }

    const userByMobile = await userService.findOneBy({
        column: "mobileNumber",
        value: body.mobileNumber,
    });

    if (userByMobile && userByMobile.isRegistered) {
        throw new BusinessError("Nomor Whatsapp sudah terdaftar", ErrorType.Duplicate);
    }

    const hash = bcrypt.hashSync(body.password, 10);
    let dataUser: CustomerDto = {
        roleId: config.roleUser,
        isRegistered: true,
        name: body.name,
        email: body.email,
        mobileNumber: body.mobileNumber,
        password: hash,
        isActive: true,
        createdAt: moment().toDate(),
    };

    let user: CustomerEntity;
    if (!userByMobile) {
        dataUser.id = uuid();
        await userService.create(dataUser);
        user = await userService.findOneBy({
            column: "id",
            value: dataUser.id,
        });
    } else {
        await userService.updateBy({
            by: "id",
            value: userByMobile.id,
            data: dataUser,
        });

        user = await userService.findOneBy({
            column: "id",
            value: userByMobile.id,
        });
    }

    req.session.cookie.maxAge = config.maxAgeLogin * 1000;
    delete req.session.data;

    if (!req.session.data) {
        req.session.data = {
            roleId: user.roleId || config.roleUser,
            isLogin: true,
            ip: req.clientIp,
            userData: user,
        };
    }

    io.emit("count:register");

    return res.send(user);
};

export const postRegistration: IApiRouter = {
    path,
    method,
    main,
    auth,
};
