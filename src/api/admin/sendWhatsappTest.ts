import { Config } from "@config/index";
import { ErrorType, TemplateMessage, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import randomatic from "randomatic";

const path = "/v1/whatsapp-test";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "mobileNumber",
        type: "string",
        required: true,
        isMobileNo: true,
    },
    {
        name: "messageId",
        type: "string",
        required: true,
        errorMessage: "Template Pesan harus diisi",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        mobileNumber: string;
        messageId: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const client = req.client;
    const io = req.io;
    const config = new Config();

    const connection = await client.checkConnection();
    if (!connection) {
        return res.send("Tidak konek");
    }

    const whatsappTemplateService = new WhatsappTemplateService();
    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "id",
        value: query.messageId,
    });

    if (!whatsappTemplate) {
        throw new BusinessError("Template Whatsapp tidak valid", ErrorType.BadRequest);
    }

    const otp = randomatic("0", 6);
    const expiredTime = config.expiredTimeOtp;
    const expiredAt = dayjs().add(expiredTime, "m").format("YYYY-MMMM-DD HH:mm:ss");

    const sendMessage = await client.sendNotifyOtp({
        targetNumber: query.mobileNumber,
        message: whatsappTemplate,
        isTest: true,
        data: {
            otp,
            expiredAt,
            expiredTime,
        },
    });

    if (!sendMessage.success) {
        throw new BusinessError("Ada kesalahan ketika mencoba mengirim pesan, silahkan coba lagi", ErrorType.Internal);
    }

    res.sendStatus(200);
};

export const sendWhatsappTest: IApiRouter = {
    main,
    path,
    method,
    auth,
};
