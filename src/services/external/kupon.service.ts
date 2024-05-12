import { Config } from "@config/index";
import { ProductDto } from "@dto/product.dto";
import { createLogCronjob, createLogCronjobKupon } from "@helper/logger";

interface IRequest<T> {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    endpoint: string;
    data?: T;
}

interface FormGameKupon {
    name: string;
    type: string;
    options?: AdditionalIdKupon[];
}

interface AdditionalIdKupon {
    value: string;
    name: string;
}

interface ResponseApi<T> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}
export interface IGameKupon {
    id: number;
    name: string;
    slug: string;
    type: string;
    form: FormGameKupon;
    isActive: boolean;
    imageUrl: string;
}

export interface IProductKupon {
    id: number;
    name: string;
    isActive: boolean;
    price: number;
}

export interface IOrderKuponStatuses {
    id: number;
    subtotalAmount: number;
    invoiceNumber: string;
    refId: any;
    source: any;
    voucherCode: any;
    totalAmount: number;
    paymentFee: number;
    partnerFee: number;
    discountAmount: number;
    target: string;
    email: string;
    phone: string;
    history: string[];
    status: string;
    quantity: number;
    product: {
        id: number;
        group: {
            name: string;
            category: {
                id: number;
                name: string;
                type: string;
                imageUrl: string;
            };
        };
    };
    voucher: any;
    user: {
        name: string;
        email: string;
    };
    orderPayment: {
        id: number;
        expiredAt: string;
        method: string;
        uniqueCode: any;
        status: string;
        info: any;
    };
}

interface GetProductBy {
    gameCd: string;
}

interface CreateTrx {
    productCode: number;
    quantity: number;
    userId: string;
    serverId?: string;
}

interface ResponseGetGames extends ResponseApi<{ categories: IGameKupon[] }> {}
interface ResponseGetProduct extends ResponseApi<{ products: IProductKupon[] }> {}
interface ResponseCreateTrx
    extends ResponseApi<{
        invoiceNumber: string;
        price: number;
        voucherCode: any;
    }> {}
interface ResponseGetOrderStatuses
    extends ResponseApi<{
        order: IOrderKuponStatuses[];
    }> {}

interface OrderData {
    productId: number;
    quantity: number;
    target: string;
    paymentMethod: string;
}
export class KuponService {
    protected apiKey: string;
    protected baseUrl: string;

    constructor(apiKey: string) {
        const config = new Config();
        this.baseUrl = config.kuponUrl;
        this.apiKey = apiKey;
    }

    async getGames(): Promise<ResponseGetGames> {
        try {
            return await this.request({
                method: "GET",
                endpoint: "product-category",
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async getProductByGamesCode(data: GetProductBy): Promise<ResponseGetProduct> {
        const param = new URLSearchParams();
        data.gameCd && param.append("categoryId", data.gameCd);

        try {
            return await this.request({
                method: "GET",
                endpoint: "product?" + param,
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async createOrder(data: CreateTrx): Promise<ResponseCreateTrx> {
        const body = {
            productId: data.productCode,
            quantity: data.quantity,
            target: data.userId,
            paymentMethod: "wallet",
        };

        if (data.userId) {
            body.target = `${data.userId}|${data.serverId}`;
        }

        try {
            return await this.request<OrderData>({
                method: "POST",
                endpoint: "order",
                data: body,
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async getOrderStatuses(extInvoiceNumber: string): Promise<ResponseGetOrderStatuses> {
        try {
            return await this.request({
                method: "GET",
                endpoint: `order/detail?invoiceNumber=${extInvoiceNumber}`,
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    private async request<IRequestBody>(data: IRequest<IRequestBody>): Promise<any> {
        const config: RequestInit = {
            method: data.method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        };

        if (data.method === "POST" || data.method === "PATCH") {
            createLogCronjobKupon().log("Request Body to Toko Kupon : " + JSON.stringify(data.data));
            config["body"] = JSON.stringify(data.data);
            config["headers"]["Content-Type"] = "application/json";
        }

        try {
            const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
            const res = await response.json();
            // createLogCronjobKupon().log("Response Body from Lapak Gaming : " + JSON.stringify(res));
            return res;
        } catch (error) {
            createLogCronjobKupon().log(error);
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }
}
