import { APIAuth, APIMethod, ErrorType, ValidatorType, EncryptJoseType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { Config } from "@config/index";
import { CustomerEntity } from "@entity/customer.entity";
import validator from "validator";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import dayjs from "dayjs";
import { EncryptionService } from "@serviceInternal/jose.service";

const path = "/v1/customer/login";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

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
    {
        name: "otp",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        username: string;
        password: string;
        otp: string;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);
    console.log(req.headers["x-forwarded-for"]);
    const convertedNumber = body.username.replace(/^(\+62|62|0)?(\d+)/, "0$2");
    const isMobileNo = validator.isMobilePhone(convertedNumber, "id-ID");
    const isEmail = validator.isEmail(body.username);

    if (!isEmail && !isMobileNo) {
        throw new BusinessError("Format Email/Nomor Whatsapp tidak valid", ErrorType.Validation);
    }

    const userService = new CustomerService();
    const config = new Config();

    let user: CustomerEntity;
    if (isEmail) {
        user = await userService.findUserWithPasswordBy("email", body.username);
    } else {
        user = await userService.findUserWithPasswordBy("mobileNumber", convertedNumber);
    }

    if (!user) {
        throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
    }

    if (user.roleId !== config.roleUser) {
        throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
    }

    const comparePassword = bcrypt.compareSync(body.password, user.password);
    if (!comparePassword) {
        throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
    }

    const otpService = new CustomerOtpService();
    const otp = await otpService.model.findOne({
        where: {
            mobileNumber: user.mobileNumber,
            type: "login",
            category: "user",
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

    const encryptService = new EncryptionService(EncryptJoseType.USER);
    const encrypt = await encryptService.encryptData(
        {
            ...user.dataValues,
            password: undefined,
        },
        7,
        "day",
    );

    const expiredAtOneYearAgo = dayjs().subtract(1, "year").toDate();
    await otpService.updateBy({
        by: "id",
        value: otp.id,
        data: {
            expiredAt: expiredAtOneYearAgo,
        },
    });

    res.cookie("session_gasskeun_user", encrypt, {
        httpOnly: true,
        maxAge: config.maxAgeLogin * 1000,
        // domain: config.domainReseller,
        // path: process.env.NODE_ENV.toLowerCase() === "production" ? "/" : "/reseller",
        secure: process.env.NODE_ENV.toLowerCase() === "production",
    });

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
