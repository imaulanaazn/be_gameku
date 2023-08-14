import { Request, Response } from "express";
import { Validation, IApiRouter } from "@interfaces/index";
import { OrderService } from "@serviceInternal/index";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";

const path = "/v1/order-history";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "customerId",
        type: "string",
        required: false,
    },
    {
        name: "orderId",
        type: "string",
        required: false,
    },
    {
        name: "mobileNumber",
        type: "string",
        required: false,
        isMobileNo: true,
    },
];
const main = async (req: Request, res: Response) => {
    const query = new Validator(req, res).process<{
        customerId?: string;
        orderId?: string;
        mobileNumber?: string;
    }>(schemaValidation, ValidatorType.QUERY, true);

    const orderService = new OrderService();
    // const findAll = await orderService.findBy(query);
    // return res.send(query.saa);
};

export const getOrderHistory: IApiRouter = {
    path,
    method,
    main,
    auth,
};
