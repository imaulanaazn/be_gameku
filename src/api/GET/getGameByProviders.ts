import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { ProviderService } from "@serviceInternal/provider.service";
import { RequestHandler } from "express";

const path = "/v1/game-providers/:id";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const param = new Validator(req, res).process<{
        id: string;
    }>(schemaValidation, ValidatorType.PARAMS);

    const providerService = new ProviderService();
    const provider = await providerService.findOneBy({
        column: "id",
        value: param.id,
    });
};

export const getGameByProviders: IApiRouter = {
    path,
    method,
    main,
    auth,
};
