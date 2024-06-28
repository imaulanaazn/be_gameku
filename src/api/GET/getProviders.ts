import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { ProviderService } from "@serviceInternal/provider.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/providers";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

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
