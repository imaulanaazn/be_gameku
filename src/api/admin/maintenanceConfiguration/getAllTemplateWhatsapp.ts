import { IApiRouter, Validation } from "@interfaces/index";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { RequestHandler } from "express";

const path = "/v1/whatsapp";
const method = "GET";
const auth = "admin";

const main: RequestHandler = async (req, res) => {
    const whatsappTemplateService = new WhatsappTemplateService();
    const template = await whatsappTemplateService.findAll();
    return res.send(template);
};

export const getAllTemplateWhatsapp: IApiRouter = {
    main,
    path,
    method,
    auth,
};
