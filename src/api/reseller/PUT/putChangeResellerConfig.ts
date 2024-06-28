import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { ResellerConfigService } from "@serviceInternal/resellerConfig.service";
import { RequestHandler } from "express";

const path = "/v1/reseller/config";
const method = APIMethod.PUT;
const auth = APIAuth.RESELLER;

const schemaValidation: Validation[] = [
    {
        name: "percentageMargin",
        type: "number",
        required: false,
    },
    {
        name: "webhookCallbackUrl",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const reseller = req.reseller.data;
    const body = new Validator(req, res).process<{
        percentageMargin: number;
        webhookCallbackUrl: string;
    }>(schemaValidation, ValidatorType.BODY);

    const resellerConfigService = new ResellerConfigService();
    await resellerConfigService.updateBy({
        by: "resellerId",
        value: reseller.id,
        data: {
            ...(body.percentageMargin ? { percentageMargin: body.percentageMargin } : {}),
            ...(body.webhookCallbackUrl ? { webhookCallbackUrl: body.webhookCallbackUrl } : {}),
        },
    });
    res.sendStatus(200);
};

export const putChangeResellerConfig: IApiRouter = {
    path,
    method,
    main,
    auth,
};
