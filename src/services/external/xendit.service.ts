import { Config } from "@config/index";
import {
    IGetPayment,
    XenditCreateEwalletDto,
    XenditCreateQRISDto,
    XenditCreateRetailDto,
    XenditCreateVADto,
} from "@dto/xendit.dto";
import { ErrorType, PaymentsCategory } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import fetch, { RequestInit } from "node-fetch";

interface IRequest<T> {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    endpoint: string;
    data?: T;
    apiVersion?: string;
}
export class XenditService {
    protected apiKey: string;
    protected baseUrl: string;

    constructor(apiKey: string) {
        const config = new Config();
        this.baseUrl = config.xenditBaseUrl;
        this.apiKey = apiKey;
    }

    async createRetailPayment(data: XenditCreateRetailDto): Promise<any> {
        try {
            return await this.request<XenditCreateRetailDto>({
                method: "POST",
                endpoint: "/fixed_payment_code",
                data,
            });
        } catch (error) {
            throw error;
        }
    }

    async createVAPayment(data: XenditCreateVADto): Promise<any> {
        try {
            return await this.request<XenditCreateVADto>({
                method: "POST",
                endpoint: "/callback_virtual_accounts",
                data,
            });
        } catch (error) {
            throw error;
        }
    }

    async createQRISPayment(data: XenditCreateQRISDto): Promise<any> {
        try {
            return await this.request<XenditCreateQRISDto>({
                method: "POST",
                endpoint: "/qr_codes",
                data,
                apiVersion: "2022-07-31",
            });
        } catch (error) {
            throw error;
        }
    }

    async getPayment(data: IGetPayment): Promise<any> {
        let path;
        if (data.category === PaymentsCategory.EWALLET) {
            path = "/ewallets/charges/";
        } else if (data.category === PaymentsCategory.QRIS) {
            path = "/qr_codes/";
        } else if (data.category === PaymentsCategory.RETAIL) {
            path = "/fixed_payment_code/";
        } else if (data.category === PaymentsCategory.VIRTUAL_ACCOUNT) {
            path = "/callback_virtual_accounts/";
        } else {
            throw new BusinessError("Category Payment is not valid", ErrorType.Internal);
        }

        try {
            return await this.request({
                method: "GET",
                endpoint: path + data.id,
                apiVersion: "2022-07-31",
            });
        } catch (error) {
            throw error;
        }
    }

    async createEwalletPayment(data: XenditCreateEwalletDto): Promise<any> {
        try {
            return await this.request<XenditCreateEwalletDto>({
                method: "POST",
                endpoint: "/ewallets/charges",
                data,
            });
        } catch (error) {
            throw error;
        }
    }

    private async request<IRequestBody>(data: IRequest<IRequestBody>): Promise<any> {
        const config: RequestInit = {
            method: data.method,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
            },
        };

        if (data.method === "POST" || data.method === "PATCH") {
            console.log("Request Body to Xendit : " + JSON.stringify(data.data));
            config["body"] = JSON.stringify(data.data);
            config["headers"]["Content-Type"] = "application/json";
        }

        if (data.apiVersion) {
            config["headers"]["api-version"] = data.apiVersion;
        }

        try {
            const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
            const res = await response.json();
            console.log("Response Body from Xendit : " + JSON.stringify(res));
            return res;
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }
}
