import { Config } from "@config/index";
import { ErrorType, OrderStatuses, TemplateMessage, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FundService } from "@serviceInternal/fund.service";
import { CustomerService, OrderService, PaymentMethodService } from "@serviceInternal/index";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import randomatic from "randomatic";
import { col, fn } from "sequelize";

const path = "/v1/notify-balance-reseller";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "userId",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        userId: string;
    }>(schemaValidation, ValidatorType.QUERY);
    const client = req.client;
    const io = req.io;
    const config = new Config();

    const customerService = new CustomerService();
    const customer = await customerService.model.findOne({
        where: {
            id: query.userId,
            roleId: config.roleReseller,
        },
    });

    if (!customer) {
        throw new BusinessError("Reseller tidak valid", ErrorType.BadRequest);
    }

    const fundService = new FundService();
    const fund = await fundService.model.findOne({
        where: {
            customerId: customer.id,
        },
    });

    const paymentMethodService = new PaymentMethodService();
    const payment = await paymentMethodService.findOneBy({
        column: "cd",
        value: "GASSKEUN",
    });

    const orderService = new OrderService();
    const order = await orderService.model.findOne({
        where: {
            // type: [OrderType.TOPUP, null],
            status: [OrderStatuses.PENDING_ORDER, OrderStatuses.PROCESSING, OrderStatuses.SUCCESS],
            customerId: customer.id,
            paymentMethodId: payment.id,
        },
        attributes: [
            ["customer_id", "customerId"],
            [fn("SUM", col("total_amt")), "totalAmt"],
        ],
    });

    const balance = fund.value - order.totalAmt;

    const whatsappTemplateService = new WhatsappTemplateService();
    const whatsappTemplate = await whatsappTemplateService.findOneBy({
        column: "cd",
        value: "balance_warning",
    });

    const otp = randomatic("0", 6);
    const expiredTime = config.expiredTimeOtp;
    const expiredAt = dayjs().add(expiredTime, "m").format("YYYY-MMMM-DD HH:mm:ss");

    const sendMessage = await client.sendNotifyBalanceReseller({
        targetNumber: customer.mobileNumber,
        message: whatsappTemplate,
        isTest: false,
        data: {
            balance,
            resellerName: customer.name,
        },
    });

    if (!sendMessage.success) {
        throw new BusinessError("Ada kesalahan ketika mencoba mengirim pesan, silahkan coba lagi", ErrorType.Internal);
    }

    res.sendStatus(200);
};

export const sendNotifyBalanceReseller: IApiRouter = {
    main,
    path,
    method,
    auth,
};
