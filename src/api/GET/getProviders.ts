import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ProviderService } from "@serviceInternal/provider.service";

const path = "/v1/providers";
const method = "GET";
const auth = "guess";

const main: RequestHandler = async (req, res) => {
    const providerService = new ProviderService();
    const providers = await providerService.findAll();

    res.send(providers);
};

export const getAllProviders: IApiRouter = {
    path,
    method,
    main,
    auth,
};
