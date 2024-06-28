import { APIAuth, APIMethod, JoseKey, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { CustomerEntity } from "@entity/customer.entity";
import { Op } from "sequelize";
import randomatic from "randomatic";
import dayjs from "dayjs";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { Config } from "@config/index";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import { v4 as uuid } from "uuid";
import { EncryptionService } from "@serviceInternal/jose.service";

const path = "/v1/reseller/otp";
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
        name: "mobileNumber",
        type: "string",
        required: false,
        isMobileNo: true,
    },
    {
        name: "password",
        type: "string",
        required: true,
    },
    {
        name: "type",
        type: "string",
        required: true,
        enum: ["login", "register"],
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        email: string;
        mobileNumber: string;
        password: string;
        type: "login" | "register";
    }>(schemaValidation, ValidatorType.BODY);
    const whatsapp = req.client;
    const config = new Config();
    const userService = new CustomerService();

    let user: CustomerEntity;
    if (body.type === "login") {
        user = await userService.model.scope("withPassword").findOne({
            where: {
                email: body.email,
                roleId: config.roleReseller,
            },
        });

        if (!user) {
            res.status(401).send({
                errorMessage: "Email atau kata sandi tidak valid",
            });

            return;
        }

        const validPassword = bcrypt.compareSync(body.password, user.password);
        if (!validPassword) {
            res.status(401).send({
                errorMessage: "Email atau kata sandi tidak valid",
            });

            return;
        }
    } else {
        const user = await userService.model.findOne({
            where: {
                [Op.or]: [
                    {
                        mobileNumber: body.mobileNumber,
                    },
                    {
                        email: body.email,
                    },
                ],
                roleId: config.roleReseller,
            },
        });

        if (user) {
            res.status(400).send({
                errorMessage: "Nomor WhatsApp atau Email sudah terdaftar",
            });
            return;
        }
    }

    const otp = randomatic("0", 6);
    const expiredTime = config.expiredTimeOtp;
    const expiredAt = dayjs().add(expiredTime, "m");
    const formatterExpiredAt = expiredAt.format("YYYY-MMMM-DD HH:mm:ss");

    const customerOtpService = new CustomerOtpService();
    let check = await customerOtpService.model.findOne({
        where: {
            mobileNumber: body.type === "login" ? user.mobileNumber : body.mobileNumber,
            category: "reseller",
            type: body.type + "_reseller",
        },
    });

    const waitingTime = 60;
    let waitingDate = dayjs().add(waitingTime, "second");
    if (!check) {
        await customerOtpService.create({
            id: uuid(),
            mobileNumber: body.type === "login" ? user.mobileNumber : body.mobileNumber,
            type: body.type + "_reseller",
            category: "reseller",
            otp,
            expiredAt: expiredAt.toDate(),
        });
    } else {
        waitingDate = dayjs(check.updatedAt).add(waitingTime, "second");
        const checkIsWaiting = dayjs().isBetween(dayjs(check.updatedAt), waitingDate);
        if (checkIsWaiting) {
            return res.status(400).send({
                message: "Silahkan tunggu beberapa saat lagi untuk request otp selanjutnya",
                waitingDate,
            });
        }

        await customerOtpService.updateBy({
            by: "id",
            value: check.id,
            data: {
                expiredAt: expiredAt.toDate(),
                otp,
            },
        });
        waitingDate = dayjs().add(waitingTime, "second");
    }

    const whatsappTemplateService = new WhatsappTemplateService();
    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "otp_" + body.type + "_reseller",
    });

    whatsapp.sendNotifyOtp({
        targetNumber: body.type === "login" ? user.mobileNumber : body.mobileNumber,
        message: whatsappTemplate,
        isTest: false,
        data: {
            otp,
            expiredAt: formatterExpiredAt,
            expiredTime: config.expiredTimeOtp,
        },
    });

    const encryptService = new EncryptionService(JoseKey.RESELLER);
    const encrypt = await encryptService.encryptData(
        {
            email: body.email,
        },
        10,
        "minute",
    );

    res.cookie(`session_${body.type}_reseller`, encrypt, {
        httpOnly: true,
        maxAge: 600000,
        // domain: config.domainReseller,
        // path: process.env.NODE_ENV.toLowerCase() === "production" ? "/" : "/reseller",
        // secure: process.env.NODE_ENV.toLowerCase() === "production",
    });

    res.send({
        waitingDate,
    });

    return;
};

export const postRequestOtp: IApiRouter = {
    main,
    path,
    method,
    auth,
};
