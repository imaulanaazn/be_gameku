import { APIAuth, APIMethod, ErrorType, JoseKey, ValidatorType } from "@enum/index";
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
import { EncryptionService } from "@serviceInternal/jose.service";
import { ResellerConfigService } from "@serviceInternal/resellerConfig.service";

const path = "/v1/reseller/registration";
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

    const encryptService = new EncryptionService(JoseKey.RESELLER);
    // const cookie = req.cookies?.session_register_reseller;
    // if (!cookie) {
    //     res.status(400).send({
    //         errorMessage: "OTP Kadaluarsa, Silahkan request OTP kembali",
    //     });
    //     return;
    // }

    // const checkCookie = await encryptService.decryptData(cookie);
    // console.log(checkCookie);

    const otpService = new CustomerOtpService();
    const otp = await otpService.model.findOne({
        where: {
            mobileNumber: body.mobileNumber,
            type: "register_reseller",
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

    const userByEmail = await userService.model.findOne({
        where: {
            email: body.email,
            roleId: config.roleReseller,
        },
    });

    if (userByEmail) {
        throw new BusinessError("Email sudah terdaftar", ErrorType.Duplicate);
    }

    const userByMobile = await userService.model.findOne({
        where: {
            mobileNumber: body.mobileNumber,
            roleId: config.roleReseller,
        },
    });

    if (userByMobile && userByMobile.isRegistered) {
        throw new BusinessError("Nomor Whatsapp sudah terdaftar", ErrorType.Duplicate);
    }

    const hash = bcrypt.hashSync(body.password, 10);
    let dataReseller: CustomerDto = {
        id: uuid(),
        roleId: config.roleReseller,
        isRegistered: true,
        name: body.name,
        email: body.email,
        mobileNumber: body.mobileNumber,
        password: hash,
        isActive: true,
        createdAt: moment().toDate(),
    };

    const newReseller = await userService.create(dataReseller);
    const encrypt = await encryptService.encryptData(
        {
            ...newReseller.dataValues,
            password: undefined,
        },
        1,
        "week",
    );

    io.emit("count:register");
    res.cookie("session_gasskeun_reseller", encrypt, {
        httpOnly: true,
        maxAge: config.maxAgeLogin * 1000,
        // domain: config.domainReseller,
        // path: "/",
        // secure: process.env.NODE_ENV.toLowerCase() === "production",
        // sameSite: "none",
    });

    const expiredAtOneYearAgo = dayjs().subtract(1, "year").toDate();
    await otpService.updateBy({
        by: "id",
        value: otp.id,
        data: {
            expiredAt: expiredAtOneYearAgo,
        },
    });

    const resellerConfigService = new ResellerConfigService();
    await resellerConfigService.create({
        id: uuid(),
        resellerId: dataReseller.id,
        percentageMargin: 0,
        apiKey: uuid(),
        webhookApiKey: uuid(),
        webhookCallbackUrl: "",
    });

    res.sendStatus(200);
    return;
};

export const postRegisterReseller: IApiRouter = {
    path,
    method,
    main,
    auth,
};
