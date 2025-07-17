// import { Config } from "@config/index";
// import * as crypto from "crypto";
// interface IConfigDigiflazz {
//     username: string;
//     apiKey: string;
// }
// type IRequestMethod = "GET" | "POST" | "PUT" | "DELETE";
// interface baseSendRequest<T> {
//     method: IRequestMethod;
//     path: string;
//     type: string;
//     data: T;
// }

// interface IProductDigiflazz {
//     product_name: string;
//     category: string;
//     brand: string;
//     type: string;
//     seller_name: string;
//     price: number;
//     buyer_sku_code: string;
//     buyer_product_status: boolean;
//     seller_product_status: boolean;
//     unlimited_stock: boolean;
//     stock: number;
//     multi: boolean;
//     start_cut_off: string;
//     end_cut_off: string;
//     desc: string;
// }

// interface IBaseBodyDigiflazz {
//     cmd?: string;
//     username?: string;
//     sign?: string;
// }

// interface ICheckSaldo {
//     saldo: number;
// }

// interface ResponseCreateTransaction {
//     ref_id: string;
//     customer_no: string;
//     buyer_sku_code: string;
//     message: string;
//     status: "Sukses" | "Pending" | "Gagal";
//     rc: string;
//     sn: string;
//     buyer_last_saldo: number;
//     price: number;
// }

// interface CreateTransaction {
//     productCd: string;
//     userId: string;
//     orderId: string;
//     testing?: boolean;
// }

// interface BodyCreateTransaction extends IBaseBodyDigiflazz {
//     buyer_sku_code: string;
//     customer_no: string;
//     ref_id: string;
//     testing?: boolean;
//     cb_url: string;
// }

// export class DigiflazzService {
//     private apiKey: string;
//     private username: string;
//     private config = new Config();

//     constructor(conf: IConfigDigiflazz) {
//         this.apiKey = conf.apiKey;
//         this.username = conf.username;
//     }

//     async getPriceList(): Promise<IProductDigiflazz[]> {
//         return await this.sendRequest<IBaseBodyDigiflazz, IProductDigiflazz[]>({
//             method: "POST",
//             data: {
//                 cmd: "prepaid",
//             },
//             path: "/v1/price-list",
//             type: "prepaid",
//         });
//     }

//     async checkSaldo(): Promise<ICheckSaldo> {
//         return await this.sendRequest<IBaseBodyDigiflazz, ICheckSaldo>({
//             method: "POST",
//             data: {
//                 cmd: "deposit",
//             },
//             path: "/v1/cek-saldo",
//             type: "depo",
//         });
//     }

//     async createTransaction(data: CreateTransaction): Promise<ResponseCreateTransaction> {
//         return await this.sendRequest<BodyCreateTransaction, ResponseCreateTransaction>({
//             method: "POST",
//             data: {
//                 buyer_sku_code: data.productCd,
//                 ref_id: data.orderId,
//                 customer_no: data.userId,
//                 testing: data.testing || false,
//                 cb_url: this.config.digiflazzCbUrl,
//             },
//             path: "/v1/transaction",
//             type: data.orderId,
//         });
//     }

//     private async sendRequest<Req, Res>(data: baseSendRequest<Req>): Promise<Res> {
//         const signature = crypto
//             .createHash("md5")
//             .update(this.username + this.apiKey + data.type)
//             .digest("hex");

//         const config: RequestInit = {
//             method: data.method,
//         };

//         if (data.method === "POST" || data.method === "PUT") {
//             config.headers = {
//                 "content-type": "application/json",
//             };

//             config.body = JSON.stringify({
//                 ...data.data,
//                 username: this.username,
//                 sign: signature,
//             });
//         }

//         const path = "https://api.digiflazz.com" + data.path;
//         const req = await fetch(path, config);
//         const res = await req.json();
//         return res.data;
//     }
// }
