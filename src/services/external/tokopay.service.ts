import { Config } from "@config/index";
import fetch, { RequestInit } from "node-fetch";
import crypto from "crypto";

interface IRequest<T> {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    endpoint: string;
    data?: T;
}

export interface ICreateSignature {
    merchantID: string;
    secretKey: string;
    refId?: string;
}

export interface ICreateInvoiceTokopay {
    paymentCode: string;
    invoiceId: string;
    totalAmt: number;
    customer: {
        name: string;
        email: string;
        mobileNumber: string;
    };
    expiredAt: number;
    product: {
        gameName: string;
        code: string;
        name: string;
        price: number;
        gameImageUrl: string;
        quantity: number;
        gameSlug: string;
    };
}

export interface ICheckInvoiceTokopay {
    paymentCode: string;
    invoiceId: string;
    totalAmt: number;
}

export interface IPushNotificationOVO {
    mobileNumber: string;
    extTrxId: string;
}

export class TokopayService {
    protected merchantID: string;
    protected secretKey: string;
    protected baseUrl: string;
    protected config: Config;

    constructor({ merchantID, secretKey }: { merchantID: string; secretKey: string }) {
        const config = new Config();
        this.merchantID = merchantID;
        this.secretKey = secretKey;
        this.baseUrl = config.tokopayUrl;
        this.config = config;
    }

    createSignature(refId?: string) {
        let data = `${this.merchantID}:${this.secretKey}`;
        if (refId) {
            data += `:${refId}`;
        }
        return crypto.createHash("md5").update(data).digest("hex");
    }

    async pushNotificationOvo(data: IPushNotificationOVO) {
        const path = `v1/payment/ovo-push`;

        try {
            return await this.request({
                method: "POST",
                endpoint: path,
                data: {
                    hp: data.mobileNumber,
                    trx_id: data.extTrxId,
                },
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    async getInvoice(data: ICheckInvoiceTokopay) {
        const path = `v1/order?merchant=${this.merchantID}&secret=${this.secretKey}&ref_id=${data.invoiceId}&nominal=${data.totalAmt}&metode=${data.paymentCode}`;

        try {
            return await this.request({
                method: "GET",
                endpoint: path,
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    async createInvoice(data: ICreateInvoiceTokopay) {
        let items = [];
        for (let i = 0; i < data.product.quantity; i++) {
            items.push({
                product_code: data.product.code,
                name: `${data.product.gameName} | ${data.product.name}`,
                price: data.product.price,
                product_url: `${this.config.feUrl}/${data.product.gameSlug}`,
                image_url: data.product.gameImageUrl,
            });
        }
        const bodyRequest = {
            merchant_id: this.merchantID,
            kode_channel: data.paymentCode,
            reff_id: data.invoiceId,
            amount: data.totalAmt,
            customer_name: data.customer.name,
            customer_email: data.customer.email,
            customer_phone: data.customer.mobileNumber,
            redirect_url: `${this.config.feUrl}/payment/${data.invoiceId}`,
            expired_ts: data.expiredAt,
            signature: this.createSignature(data.invoiceId),
            items,
        };

        try {
            return await this.request({
                method: "POST",
                endpoint: "v1/order",
                data: bodyRequest,
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    private async request<IRequestBody>(data: IRequest<IRequestBody>): Promise<any> {
        const config: RequestInit = {
            method: data.method,
        };

        if (data.method === "POST" || data.method === "PATCH") {
            console.log("Request Body to Tokopay : " + JSON.stringify(data.data));
            config["body"] = JSON.stringify(data.data);
            config["headers"] = {};
            config["headers"]["Content-Type"] = "application/json";
        }

        try {
            const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
            const res = await response.json();
            console.log("Response Body from Tokopay : " + JSON.stringify(res));
            return res;
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }
}
