import { Config } from "@config/index";
import { ErrorType, OrderStatuses, ValidatorType, VoucherType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { FundService } from "@serviceInternal/fund.service";
import { GameService } from "@serviceInternal/game.service";
import { OrderService } from "@serviceInternal/order.service";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { ProductService } from "@serviceInternal/product.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v1/approval-deposit";
const method = "POST";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "orderId",
        type: "string",
        required: true,
    },
    {
        name: "status",
        type: "boolean",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body = new Validator(req, res).process<{
        orderId: string;
        status: boolean;
    }>(schemaValidation, ValidatorType.BODY);
    console.log(body);

    const config = new Config();
    const orderService = new OrderService();
    const order = await orderService.findOneBy({
        column: "id",
        value: body.orderId,
    });

    if (!order) {
        throw new BusinessError("Pesanan tidak valid", ErrorType.BadRequest);
    }
    const orderDetailService = new OrderDetailService();
    const orderDetail = await orderDetailService.findOneBy({
        column: "orderId",
        value: order.id,
    });

    const customerService = new CustomerService();
    const customer = await customerService.findOneBy({
        column: "id",
        value: order.customerId,
    });
    // const whatsappTemplateService = new WhatsappTemplateService();
    // const whatsappTemplate = await whatsappTemplateService.findOneBy({
    //     column: "cd",
    //     value: "order_success",
    // });
    if (order.status !== OrderStatuses.SUCCESS && body.status === true) {
        const fundService = new FundService();
        const fund = await fundService.findOneBy({
            column: "customerId",
            value: customer.id,
        });

        if (!fund) {
            await fundService.create({
                id: uuid(),
                customerId: customer.id,
                name: "Gasskeun Coin",
                value: orderDetail.amount,
            });

            return;
        }

        const balance = fund.value + orderDetail.amount;
        await fundService.updateBy({
            by: "id",
            value: fund.id,
            data: {
                value: balance,
            },
        });

        await orderService.updateBy({
            by: "id",
            value: body.orderId,
            data: {
                status: OrderStatuses.SUCCESS,
                completedAt: dayjs().toDate(),
            },
        });
    } else if (body.status === false) {
        await orderService.updateBy({
            by: "id",
            value: body.orderId,
            data: {
                status: OrderStatuses.FAILED,
            },
        });
    }

    return res.sendStatus(200);
};

export const approvalDeposit: IApiRouter = {
    path,
    method,
    main,
    auth,
};
