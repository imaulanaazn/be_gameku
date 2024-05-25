import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { PaymentMethodService } from "@serviceInternal/paymentMethod.service";
import { RequestHandler } from "express";
import { Op } from "sequelize";
import { IApiRouter, Validation } from "src/interfaces";

const path = "/api/v1/payments-method";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "query",
        required: false,
        type: "string",
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        query: string;
    }>(schemaValidation, ValidatorType.QUERY);
    console.log(req.path);
    const paymentMethodService = new PaymentMethodService();

    if (query?.query && query.query === "9") {
        const paymentMethod = await paymentMethodService.model.findAll({
            where: {
                isActive: true,
                deleted: false,
                cd: {
                    [Op.notIn]: ["GASSKEUN", "GASSKEUN_DEPOSIT"],
                },
            },
        });
        res.send(paymentMethod);
    } else {
        const paymentMethod = await paymentMethodService.model.findAll({
            where: {
                isActive: true,
                deleted: false,
            },
        });
        res.send(paymentMethod);
    }
    return;
};

export const getListPaymentsMethod: IApiRouter = {
    main,
    path,
    method,
    auth,
};
