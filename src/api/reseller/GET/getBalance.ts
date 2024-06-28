import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { FundService } from "@serviceInternal/fund.service";
import { OrderService } from "@serviceInternal/order.service";
import { v4 as uuid } from "uuid";
import { Op } from "sequelize";
import { OrderStatuses, OrderType } from "@enum/index";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/reseller/balance";
const method = APIMethod.GET;
const auth = APIAuth.RESELLER;

const main: RequestHandler = async (req, res) => {
    const session = req.reseller.data;
    const fundService = new FundService();
    const orderService = new OrderService();
    const paymentMethodService = new PaymentMethodService();

    const payment = await paymentMethodService.findOneBy({
        column: "cd",
        value: "GASSKEUN",
    });

    let fund = await fundService.findOneBy({
        column: "customerId",
        value: session.id,
    });

    if (!fund) {
        await fundService.create({
            id: uuid(),
            customerId: session.id,
            name: "Gasskeun Coin",
            value: 0,
        });

        fund = await fundService.findOneBy({
            column: "customerId",
            value: session.id,
        });
    }

    const orders = await orderService.model.sum("totalAmt", {
        where: {
            // type: [OrderType.TOPUP, null],
            status: [OrderStatuses.PENDING_ORDER, OrderStatuses.PROCESSING, OrderStatuses.SUCCESS],
            customerId: session.id,
            paymentMethodId: payment.id,
        },
    });
    return res.send({ ...fund.dataValues, value: fund.value - orders });
};

export const getBalance: IApiRouter = {
    path,
    method,
    main,
    auth,
};
