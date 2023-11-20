import * as crypto from "crypto";
import fetch, { RequestInit } from "node-fetch";
import {
    CheckGameAccount,
    PostTransactionDto,
    ResponseTransactionErrorDto,
    ResponseTransactionSuccessDto,
} from "@dto/apiGames.dto";
import { BusinessError } from "@helper/handleError";
import { ErrorType } from "@enum/index";

interface IConfigApiGames {
    merchantId: string;
    secretKey: string;
}

interface IRequest<T> {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    endpoint: string;
    data?: T;
}

interface ICheckGameAccount {
    gameCode: string;
    userId: string;
}

class APIGamesService {
    protected merchantId: string;
    protected secretKey: string;
    protected baseUrl: string;

    constructor(data: IConfigApiGames) {
        this.merchantId = data.merchantId;
        this.secretKey = data.secretKey;
        this.baseUrl = "https://v1.apigames.id";
    }

    async checkUsernameGame(data: ICheckGameAccount): Promise<CheckGameAccount> {
        console.log("START CHECK USERNAME TO API GAMES");
        const signature = crypto
            .createHash("md5")
            .update(this.merchantId + this.secretKey)
            .digest("hex");
        const url = `${this.baseUrl}/merchant/${this.merchantId}/cek-username/${data.gameCode}?user_id=${data.userId}&signature=${signature}`;
        console.log(url);
        try {
            const req = await fetch(url, {
                method: "GET",
            });

            const res = await req.json();

            console.log(res);
            console.log("FINISH CHECK USERNAME TO API GAMES");
            return res;
        } catch (error) {
            console.error(error);
            throw new BusinessError("Something wrong, please wait and try again", ErrorType.Internal);
        }
    }

    async createTransaction(
        data: PostTransactionDto,
    ): Promise<ResponseTransactionSuccessDto | ResponseTransactionErrorDto> {
        const signature = crypto
            .createHash("md5")
            .update(`${this.merchantId}:${this.secretKey}:${data.invoiceId}`)
            .digest("hex");
        const url = `${this.baseUrl}/v2/transaksi`;
        try {
            console.log("START CREATE TRX TO API GAMES");
            console.log({
                ref_id: data.invoiceId,
                merchant_id: this.merchantId,
                produk: data.productCode,
                tujuan: data.userId,
                signature,
            });
            const req = await fetch(url, {
                method: "POST",
                body: JSON.stringify({
                    ref_id: data.invoiceId,
                    merchant_id: this.merchantId,
                    produk: data.productCode,
                    tujuan: data.userId,
                    signature,
                }),
            });

            const res = await req.json();
            console.log(res);
            console.log("FINISH CREATE TRX TO API GAMES");
            return res;
        } catch (error) {
            console.error(error);
            throw new BusinessError("Something wrong, please wait and try again", ErrorType.Internal);
        }
    }

    // private async request<IRequestBody>(data: IRequest<IRequestBody>): Promise<any> {
    //     const config: RequestInit = {
    //         method: data.method,
    //     };

    //     if (data.method === "POST" || data.method === "PATCH") {
    //         console.log("Request Body to Xendit : " + JSON.stringify(data.data));
    //         config["body"] = JSON.stringify(data.data);
    //         config["headers"]["Content-Type"] = "application/json";
    //     }

    //     try {
    //         const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
    //         const res = await response.json();
    //         console.log("Response Body from Api Games : " + JSON.stringify(res));
    //         return res;
    //     } catch (error) {
    //         const message = `An error occurred: ${error.message}`;
    //         throw new Error(message);
    //     }
    // }
}

export default APIGamesService;
