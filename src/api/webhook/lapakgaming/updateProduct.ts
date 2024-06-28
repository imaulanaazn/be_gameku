import { RequestHandler } from "express";
import { IApiRouter } from "src/interfaces";
import { OrderService } from "@serviceInternal/order.service";
import { OrderStatuses, DigiflazzStatuses } from "@enum/index";
import dayjs from "dayjs";
import { OrderDetailService } from "@serviceInternal/orderDetail.service";
import { CustomerService } from "@serviceInternal/customer.service";
import { WhatsappTemplateService } from "@serviceInternal/whatsappTemplate.service";
import { Config } from "@config/index";
import { ProductService } from "@serviceInternal/product.service";
import { createLogWebhook } from "@helper/logger";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/webhook/lapakgaming-product";
const method = APIMethod.POST;
const auth = APIAuth.GUEST;

const main: RequestHandler = async (req, res) => {
    const client = req.client;
    const io = req.io;
    const body: {
        data: {
            code: string;
            name: string;
            provider_code: string;
            price: number;
            status: string;
        };
        meta: {
            unix_timestamp: number;
        };
    } = req.body;

    createLogWebhook().log("@@@ START TRIGGER WEBHOOK FOR UPDATE DATA PRODUCT LAPAK GAMING");
    createLogWebhook().log(body);
    res.sendStatus(200);

    const sysConfigService = new SysConfigService();
    const sysConfig = await sysConfigService.findManyBy({
        column: "cd",
        value: ["percentage_prices", "percentage_prices_reseller"],
        operator: "in",
    });

    const percentageUser = sysConfig.find((item) => item.cd === "percentage_prices");
    const percentageReseller = sysConfig.find((item) => item.cd === "percentage_prices_reseller");

    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "code",
        value: body.data.code,
    });

    if (!product) {
        createLogWebhook().log(`Product dengan code ${body.data.code} tidak kita simpan`);
        return;
    }

    await productService.updateBy({
        by: "id",
        value: product.id,
        data: {
            price: body.data.price + (body.data.price * parseInt(percentageUser.value)) / 100,
            resellerPrice: body.data.price + (body.data.price * parseInt(percentageReseller.value)) / 100,
            priceBuy: body.data.price,
            isActive: body.data.status === "available" ? true : false,
        },
    });

    createLogWebhook().log("@@@ END TRIGGER WEBHOOK FOR UPDATE DATA PRODUCT LAPAK GAMING");
};

export const webhookLapakGamingUpdateProduct: IApiRouter = {
    path,
    method,
    main,
    auth,
};
