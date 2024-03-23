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

const path = "/v1/webhook/lapakgaming-product";
const method = "POST";
const auth = "guess";

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

    console.log("@@@ START TRIGGER WEBHOOK FOR UPDATE DATA PRODUCT LAPAK GAMING");
    console.log(body);
    res.sendStatus(200);
    const productService = new ProductService();
    const product = await productService.findOneBy({
        column: "code",
        value: body.data.code,
    });

    if (!product) {
        console.log(`Product dengan code ${body.data.code} tidak kita simpan`);
        return;
    }

    await productService.updateBy({
        by: "id",
        value: product.id,
        data: {
            price: body.data.price + (body.data.price * 3) / 100,
            resellerPrice: body.data.price + (body.data.price * 1) / 100,
            priceBuy: body.data.price,
            isActive: body.data.status === "available" ? true : false,
        },
    });

    console.log("@@@ END TRIGGER WEBHOOK FOR UPDATE DATA PRODUCT LAPAK GAMING");
};

export const webhookLapakGamingUpdateProduct: IApiRouter = {
    path,
    method,
    main,
    auth,
};
