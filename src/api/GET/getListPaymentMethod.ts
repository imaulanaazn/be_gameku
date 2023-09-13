import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";

const path = "/api/v1/payments-method";
const method = "GET";
const auth = "guess";

const main: RequestHandler = async (req, res) => {
    const paymentMethodService = new PaymentMethodService();
    const paymentMethod = await paymentMethodService.findManyBy({
        column: "isActive",
        value: true,
    });
    res.send(paymentMethod);
};

export const getListPaymentsMethod: IApiRouter = {
    main,
    path,
    method,
    auth,
};
