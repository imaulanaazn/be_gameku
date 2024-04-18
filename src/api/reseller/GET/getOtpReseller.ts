import { Config } from "@config/index";
import { IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import { EncryptionService } from "@serviceInternal/jose.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import randomatic from "randomatic";
import { v4 as uuid } from "uuid";

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const reseller = req.reseller.data;

    const whatsapp = req.client;
    const config = new Config();
    const userService = new CustomerService();
    const otp = randomatic("0", 6);
    const expiredTime = config.expiredTimeOtp;
    const expiredAt = dayjs().add(expiredTime, "m");
    const formatterExpiredAt = expiredAt.format("YYYY-MMMM-DD HH:mm:ss");

    const customerOtpService = new CustomerOtpService();
    let check = await customerOtpService.model.findOne({
        where: {
            mobileNumber: reseller.mobileNumber,
            category: "reseller",
            type: "change_password_reseller",
        },
    });

    const waitingTime = 60;
    let waitingDate = dayjs().add(waitingTime, "second");
    if (!check) {
        await customerOtpService.create({
            id: uuid(),
            mobileNumber: reseller.mobileNumber,
            type: "change_password_reseller",
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
        value: "change_password_reseller",
    });

    whatsapp.sendNotifyOtp({
        targetNumber: reseller.mobileNumber,
        message: whatsappTemplate,
        isTest: false,
        data: {
            otp,
            expiredAt: formatterExpiredAt,
            expiredTime: config.expiredTimeOtp,
        },
    });

    const encryptService = new EncryptionService();
    const encrypt = await encryptService.encryptData(
        {
            email: reseller.email,
        },
        10,
        "minute",
    );

    res.cookie(`session_change_password_reseller`, encrypt, {
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

export const getChangePasswordOtp: IApiRouter = {
    main,
    path: "/v1/reseller/otp-change-password",
    method: "GET",
    auth: "reseller",
};
