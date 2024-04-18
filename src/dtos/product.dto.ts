import { MainDto } from "./main.dto";

export class ProductDto extends MainDto {
    gameId: string;
    categoryId: string;
    name: string;
    automatically?: boolean;
    code: string;
    price: number;
    resellerPrice: number;
    priceBuy?: number;
    logoDenom: string;
    isActive?: boolean;
    deleted: boolean;
}
