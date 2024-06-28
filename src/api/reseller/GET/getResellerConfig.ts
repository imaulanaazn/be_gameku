import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { ResellerConfigService } from "@serviceInternal/resellerConfig.service";
import { RequestHandler } from "express";

const path = "/v1/reseller/config";
const method = APIMethod.GET;
const auth = APIAuth.RESELLER;

const schemaValidation: Validation[] = [
    {
        name: "cd",
        type: "string",
        required: true,
        enum: ["percentageMargin", "webhookCallbackUrl"],
    },
];

const main: RequestHandler = async (req, res) => {
    const reseller = req.reseller.data;
    const query = new Validator(req, res).process<{
        cd: string | "percentageMargin" | "webhookCallbackUrl";
    }>(schemaValidation, ValidatorType.QUERY);

    const resellerConfigService = new ResellerConfigService();
    const resellerConfig = await resellerConfigService.model.findOne({
        where: {
            resellerId: reseller.id,
        },
        attributes: [query.cd],
    });
    res.send(resellerConfig);
};

export const getResellerConfig: IApiRouter = {
    path,
    method,
    main,
    auth,
};
