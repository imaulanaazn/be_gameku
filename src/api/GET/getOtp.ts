import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerStatuses, ErrorType, ValidatorType } from "@enum/index";
import { Config } from "@config/index";
import { Validator } from "@helper/validator";
import { BusinessError } from "@helper/handleError";
import dayjs from "dayjs";
import randomatic from "randomatic";
import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
import { v4 as uuid } from "uuid";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import isBetween from "dayjs/plugin/isBetween";
import { CustomerService } from "@serviceInternal/customer.service";
import { Op } from "sequelize";
import { CustomerEntity } from "@entity/customer.entity";
import { getCustomerStatuses } from "@helper/checkCustomerStatuses";
dayjs.extend(isBetween);

const path = "/v1/otp";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "type",
        required: true,
        type: "string",
        enum: ["login", "register"],
    },
    {
        name: "mobileNumber",
        required: false,
        type: "string",
        isMobileNo: true,
    },
    {
        name: "email",
        required: false,
        type: "string",
        isEmail: true,
    },
    {
        name: "category",
        required: false,
        type: "string",
        enum: ["user"],
        default: "user",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        type: "login" | "register";
        mobileNumber?: string;
        category: "user";
        email?: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const whatsapp = req.client;

    const config = new Config();
    const customerOtpService = new CustomerOtpService();
    const whatsappTemplateService = new WhatsappTemplateService();
    const customerService = new CustomerService();

    const otp = randomatic("0", 6);
    const expiredTime = config.expiredTimeOtp;
    const expiredAt = dayjs().add(expiredTime, "m");
    const formatterExpiredAt = expiredAt.format("YYYY-MMMM-DD HH:mm:ss");

    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "otp_" + query.type,
    });

    let customer: CustomerEntity;
    if (query.type === "login") {
        if (!query.email && !query?.mobileNumber) {
            throw new BusinessError("Email atau mobile number tidak valid", ErrorType.BadRequest);
        }

        customer = await customerService.model.findOne({
            where: {
                [Op.or]: [
                    {
                        mobileNumber: query.mobileNumber || "",
                    },
                    {
                        email: query.email || "",
                    },
                ],
                isRegistered: true,
            },
        });

        if (!customer) {
            throw new BusinessError("Nomor handphone belum terdaftar", ErrorType.BadRequest);
        }

        const customerStatus = getCustomerStatuses(customer);
        if (!customerStatus.valid) {
            throw new BusinessError(customerStatus.message, ErrorType.Locked);
        }
    }

    if (query.type === "register" && !query?.mobileNumber) {
        throw new BusinessError("Mobile Number harus diisi", ErrorType.Validation);
    }

    let check = await customerOtpService.model.findOne({
        where: {
            mobileNumber: customer?.mobileNumber || query?.mobileNumber,
            category: query.category,
            type: query.type,
        },
    });

    const waitingTime = 60;
    let waitingDate = dayjs().add(waitingTime, "second");
    if (!check) {
        await customerOtpService.create({
            id: uuid(),
            mobileNumber: customer?.mobileNumber || query?.mobileNumber,
            type: query.type,
            category: query.category,
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

    whatsapp.sendNotifyOtp({
        targetNumber: customer?.mobileNumber || query?.mobileNumber,
        message: whatsappTemplate,
        isTest: false,
        data: {
            otp,
            expiredAt: formatterExpiredAt,
            expiredTime: config.expiredTimeOtp,
        },
    });

    return res.send({
        waitingDate,
    });
};

export const getOtp: IApiRouter = {
    path,
    method,
    main,
    auth,
};
