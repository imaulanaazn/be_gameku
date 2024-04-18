import { Config } from "@config/index";
import { ProductDto } from "@dto/product.dto";
import { createLogCronjob } from "@helper/logger";

interface IRequest<T> {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    endpoint: string;
    data?: T;
}

interface FormGameLapakGaming {
    name: string;
    type: string;
    options: {
        value: string;
        name: string;
    }[];
}

interface AdditionalIdLapakGaming {
    value: string;
    name: string;
}

interface ResponseApi<T> {
    code: string;
    data: T;
}
export interface IGameLapakGaming {
    code: string;
    name: string;
    variant: string;
    check_id: string;
    forms: FormGameLapakGaming[];
    servers: AdditionalIdLapakGaming[];
}

export interface IProductLapakGaming {
    code: string;
    name: string;
    provider_code: string;
    price: number;
    process_time: number;
    status: string;
}

interface GetProductBy {
    gameCd: string;
    productCd?: string;
}

interface CreateTrx {
    userId?: string;
    serverId?: string;
    quantity: number;
    invoiceId: string;
    product: ProductDto;
}

interface ResponseGetGames extends ResponseApi<{ categories: IGameLapakGaming[] }> {}
interface ResponseGetProduct extends ResponseApi<{ products: IProductLapakGaming[] }> {}
interface ResponseCreateTrx
    extends ResponseApi<{
        tid: string;
        total_price: number;
    }> {}

interface OrderData {
    user_id?: string;
    additional_id?: string;
    additional_information?: string;
    count_order: number;
    product_code: string;
    price?: number;
    partner_reference_id?: string;
}
export class LapakGamingService {
    protected apiKey: string;
    protected baseUrl: string;

    constructor(apiKey: string) {
        const config = new Config();
        this.baseUrl = config.lapakGamingUrl;
        this.apiKey = apiKey;
    }

    async getGames(): Promise<ResponseGetGames> {
        try {
            return await this.request({
                method: "GET",
                endpoint: "/api/category",
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async getProductByGamesCode(data: GetProductBy): Promise<ResponseGetProduct> {
        const param = new URLSearchParams();
        data.gameCd && param.append("category_code", data.gameCd);
        data.productCd && param.append("product_code", data.productCd);

        try {
            return await this.request({
                method: "GET",
                endpoint: "/api/product?" + param,
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async getAllProducts(): Promise<ResponseGetProduct> {
        try {
            return await this.request({
                method: "GET",
                endpoint: "/api/all-products?",
            });
        } catch (error) {
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }

    async createOrder(data: CreateTrx): Promise<ResponseCreateTrx> {
        const body = {
            ...(data.userId && { user_id: data.userId }),
            ...(data.serverId && { additional_id: data.serverId }),
            count_order: data.quantity,
            product_code: data.product.code,
            price: data.product.priceBuy,
            partner_reference_id: data.invoiceId,
        };

        try {
            return await this.request<OrderData>({
                method: "POST",
                endpoint: "/api/order",
                data: body,
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
            createLogCronjob().log("Request Body to Lapak Gaming : " + JSON.stringify(data.data));
            config["body"] = JSON.stringify(data.data);
            config["headers"]["Content-Type"] = "application/json";
        }

        try {
            const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
            const res = await response.json();
            createLogCronjob().log("Response Body from Lapak Gaming : " + JSON.stringify(res));
            return res;
        } catch (error) {
            createLogCronjob().log(error);
            const message = `An error occurred: ${error.message}`;
            throw new Error(message);
        }
    }
}
