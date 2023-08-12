import { Config } from "@config/index";
import { XenditCreateEwalletDto, XenditCreateQRISDto, XenditCreateRetailDto, XenditCreateVADto } from "@dto/xendit.dto";
import fetch, { RequestInit } from "node-fetch";

export class XenditService {
    protected apiKey: string;
    protected baseUrl: string;

    constructor() {
        const config = new Config();
        this.apiKey = config.xenditSecretKey;
        this.baseUrl = config.xenditBaseUrl;
    }

    async createRetailPayment(data: XenditCreateRetailDto): Promise<any> {
        return await this.request<XenditCreateRetailDto>("POST", "/fixed_payment_code", data);
    }

    async createVAPayment(data: XenditCreateVADto): Promise<any> {
        return await this.request<XenditCreateVADto>("POST", "/callback_virtual_accounts", data);
    }

    async createQRISPayment(data: XenditCreateQRISDto): Promise<any> {
        return await this.request<XenditCreateQRISDto>("POST", "/qr_codes", data, "2022-07-31");
    }

    async createEwalletPayment(data: XenditCreateEwalletDto): Promise<any> {
        try {
            return await this.request<XenditCreateEwalletDto>("POST", "/ewallets/charges", data);
        } catch (error) {
            throw error;
        }
    }

    private async request<IRequestBody>(
        method: "POST" | "GET" | "PATCH" | "DELETE",
        endpoint: string,
        data?: IRequestBody,
        apiVersion?: string,
    ): Promise<any> {
        const config: RequestInit = {
            method,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
            },
        };

        if (method === "POST" || method === "PATCH") {
            console.log("Request Body to Xendit : " + JSON.stringify(data));
            config["body"] = JSON.stringify(data);
            config["headers"]["Content-Type"] = "application/json";
        }

        if (apiVersion) {
            config["headers"]["api-version"] = apiVersion;
        }

        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, config);
            const res = await response.json();
            console.log("Response Body from Xendit : " + JSON.stringify(res));
            return res;
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }
}
