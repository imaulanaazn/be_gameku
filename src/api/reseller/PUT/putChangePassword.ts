import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import { BusinessError } from "@helper/handleError";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import { CustomerService } from "@serviceInternal/customer.service";

const path = "/v1/reseller/change-password";
const method = "PUT";
const auth = "reseller";

const schemaValidation: Validation[] = [
    {
        name: "oldPassword",
        type: "string",
        required: true,
    },
    {
        name: "newPassword",
        type: "string",
        required: true,
    },
    {
        name: "verificationCode",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        oldPassword: string;
        newPassword: string;
        verificationCode: string;
    }>(schemaValidation, ValidatorType.BODY);

    const reseller = req.reseller.data;
    const otpService = new CustomerOtpService();
    const otp = await otpService.model.findOne({
        where: {
            mobileNumber: reseller.mobileNumber,
            type: "change_password_reseller",
            category: "reseller",
        },
    });

    if (!otp) {
        throw new BusinessError("Silahkan coba beberapa saat lagi, dan coba lagi", ErrorType.BadRequest);
    }

    const isExpired = dayjs(dayjs(otp.expiredAt)).isBefore(dayjs());
    if (isExpired) {
        throw new BusinessError("Otp sudah kadaluarsa", ErrorType.BadRequest);
    }

    if (otp.otp !== body.verificationCode) {
        throw new BusinessError("Otp tidak valid", ErrorType.BadRequest);
    }

    const customerService = new CustomerService();
    const customer = await customerService.findResellerWithPasswordBy("id", reseller.id);

    const isPassword = bcrypt.compareSync(body.oldPassword, customer.password);

    if (!isPassword) {
        throw new BusinessError("Kata sandi tidak valid", ErrorType.BadRequest);
    }

    const compareNewPassword = bcrypt.compareSync(body.newPassword, customer.password);
    if (compareNewPassword) {
        throw new BusinessError("Kata sandi baru tidak boleh sama dengan kata sandi lama", ErrorType.BadRequest);
    }

    if (body.oldPassword === body.newPassword) {
        throw new BusinessError("Password baru tidak boleh sama dengan password lama", ErrorType.BadRequest);
    }

    const newPassword = bcrypt.hashSync(body.newPassword, 10);
    await customerService.updateBy({
        by: "id",
        value: customer.id,
        data: {
            password: newPassword,
        },
    });

    const expiredAtOneYearAgo = dayjs().subtract(1, "year").toDate();
    await otpService.updateBy({
        by: "id",
        value: otp.id,
        data: {
            expiredAt: expiredAtOneYearAgo,
        },
    });

    res.sendStatus(200);
    return;
};

export const putChangePassword: IApiRouter = {
    main,
    method,
    path,
    auth,
};
