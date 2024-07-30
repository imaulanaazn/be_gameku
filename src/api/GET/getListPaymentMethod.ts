import { PaymentMethodDto } from "@dto/paymentMethod.dto";
import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import RedisService from "@serviceExternal/externalRedis.service";
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

    const redisService = new RedisService();
    let redisKey = `payments`;

    if (query?.query && query.query === "9") {
        redisKey += `:9`;
        const paymentFromRedis = await redisService.getJson<PaymentMethodDto[]>(redisKey);
        if (paymentFromRedis && paymentFromRedis.length > 0) {
            res.send(paymentFromRedis);
            return;
        }

        const paymentMethod = await paymentMethodService.model.findAll({
            where: {
                isActive: true,
                deleted: false,
                cd: {
                    [Op.notIn]: ["GASSKEUN", "GASSKEUN_DEPOSIT"],
                },
            },
        });

        await redisService.setJson(redisKey, paymentMethod);
        res.send(paymentMethod);
    } else {
        redisKey += ":all";
        const paymentFromRedis = await redisService.getJson<PaymentMethodDto[]>(redisKey);
        if (paymentFromRedis && paymentFromRedis.length > 0) {
            res.send(paymentFromRedis);
            return;
        }

        const paymentMethod = await paymentMethodService.model.findAll({
            where: {
                isActive: true,
                deleted: false,
            },
        });

        await redisService.setJson(redisKey, paymentMethod);
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
