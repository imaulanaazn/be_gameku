import { Config } from "@config/index";
import { ProductDto } from "@dto/product.dto";
import { createLogCronjob } from "@helper/logger";

interface IRequest<T> {
  method: "POST" | "GET" | "PATCH" | "DELETE";
  endpoint: string;
  data?: T;
}

interface ResponseApi<T> {
  status: string;
  msg: string;
  data: T;
}
// export interface IGameMiracleGaming {
//   id: string;
//   nama_layanan: string;
//   kategori: string;
//   harga: number;
//   harga_gold: number;
//   harga_silver: number;
//   harga_pro: number;
//   status: string;
// }

export interface IProductMiracleGaming {
  id: string;
  nama_layanan: string;
  kategori: string;
  harga: number;
  harga_gold: number;
  harga_silver: number;
  harga_pro: number;
  status: string;
}

interface GetProductBy {
  gameCd: string;
  productCd?: string;
}

interface CreateTrx {
  userId?: string;
  serverId?: string;
  // quantity: number;
  invoiceId: string;
  product: ProductDto;
}

// interface ResponseGetGames
//   extends ResponseApi<{ categories: IGameMiracleGaming[] }> {}
interface ResponseGetProduct extends ResponseApi<IProductMiracleGaming[]> {}
interface ResponseCreateTrx
  extends ResponseApi<{
    id: string;
    service_name: string;
    service_id: string;
    target: string;
    kontak: string;
    keterangan: string;
    status: string;
  }> {}

interface OrderData {
  api_key: string;
  service_id: string;
  target: string;
  kontak: string;
  idtrx: string;
  callback: string;
}
export class MiracleGamingService {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string) {
    const config = new Config();
    this.baseUrl = config.miracleGamingUrl;
    this.apiKey = apiKey;
  }

  // async getGames(): Promise<ResponseGetGames> {
  //   try {
  //     return await this.request({
  //       method: "GET",
  //       endpoint: "/api/category",
  //     });
  //   } catch (error) {
  //     const message = `An error occurred: ${error.message}`;
  //     throw new Error(message);
  //   }
  // }

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
        method: "POST",
        endpoint: "/service",
        data: {
          api_key: this.apiKey,
        },
      });
    } catch (error) {
      const message = `An error occurred: ${error.message}`;
      throw new Error(message);
    }
  }

  async createOrder(data: CreateTrx): Promise<ResponseCreateTrx> {
    const body = {
      api_key: this.apiKey,
      service_id: data.product.code,
      target: data.serverId ? `${data.userId}|${data.serverId}` : data.userId,
      kontak: "08895501350", // This should be the user's phone number
      idtrx: data.invoiceId,
      callback: "",
    };

    try {
      return await this.request<OrderData>({
        method: "POST",
        endpoint: "/order",
        data: body,
      });
    } catch (error) {
      const message = `An error occurred: ${error.message}`;
      throw new Error(message);
    }
  }

  async getOrderStatus(orderId: string): Promise<ResponseApi<any>> {
    const body = {
      api_key: this.apiKey,
      order_id: orderId,
    };
    try {
      return await this.request({
        method: "POST",
        endpoint: `/status`,
        data: body,
      });
    } catch (error) {
      const message = `An error occurred: ${error.message}`;
      throw new Error(message);
    }
  }

  private async request<IRequestBody>(
    data: IRequest<IRequestBody>
  ): Promise<any> {
    const config: RequestInit = {
      method: data.method,
      headers: {},
    };

    if (data.method === "POST" || data.method === "PATCH") {
      createLogCronjob().log(
        "Request Body to Miracle Gaming : " + JSON.stringify(data.data)
      );
      config["body"] = JSON.stringify(data.data);
      config["headers"]["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(`${this.baseUrl}/${data.endpoint}`, config);
      const res = await response.json();
      createLogCronjob().log(
        "Response Body from Miracle Gaming : " + JSON.stringify(res)
      );
      return res;
    } catch (error) {
      createLogCronjob().log(error);
      const message = `An error occurred: ${error.message}`;
      throw new Error(message);
    }
  }
}
