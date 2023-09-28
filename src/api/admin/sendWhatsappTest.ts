import { ErrorType, TemplateMessage, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { RequestHandler } from "express";

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
        name: "messageType",
        type: "string",
        required: false,
        enum: ["OTP_LOGIN", "OTP_REGISTER", "ORDER_FAILED", "ORDER_SUCCESS", "ORDER_PENDING"],
        default: "OTP_LOGIN",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        mobileNumber: string;
        messageType: "OTP_LOGIN" | "OTP_REGISTER" | "ORDER_FAILED" | "ORDER_SUCCESS" | "ORDER_PENDING";
    }>(schemaValidation, ValidatorType.QUERY);
    const client = req.client;
    const io = req.io;

    const connection = await client.checkConnection();
    if (!connection) {
        return res.send("Tidak konek");
    }

    let sendNotify;
    if (query.messageType.split("_")[0] === "OTP") {
        sendNotify = await client.sendNotifyOtp({
            targetNumber: query.mobileNumber,
            template: TemplateMessage[query.messageType],
            isTest: true,
        });
    } else {
        sendNotify = await client.sendNotifyOrder({
            targetNumber: query.mobileNumber,
            template: TemplateMessage[query.messageType],
            isTest: true,
            data: {
                invoiceId: "INV1693470160749",
                link: "https://google.com",
                quantity: 2,
                mobileNumber: "089123456789",
                amount: 10000,
                game: "Mobile Legends",
                productName: "2976 Diamond",
                paymentMethod: "QRIS",
                totalAmt: 20000,
                feeAmt: 0,
                discAmt: 0,
            },
        });
    }

    console.log(sendNotify);

    if (!sendNotify.success) {
        throw new BusinessError(sendNotify.msg, ErrorType.Internal);
    }

    res.sendStatus(200);
};

export const sendWhatsappTest: IApiRouter = {
    main,
    path,
    method,
    auth,
};
