import { MainDto } from "./main.dto";

export class ProductDto extends MainDto {
    categoryId: string;
    name: string;
    automatically?: boolean;
    code: string;
    price: number;
    resellerPrice: number;
    priceBuy?: number;
    logoDenom: string;
    gameId: string;
    deleted: boolean;
    isActive?: boolean;
}
