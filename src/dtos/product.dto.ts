import { MainDto } from "./main.dto";

export class ProductDto extends MainDto {
    name: string;
    code: string;
    price: number;
    priceBuy?: number;
    logoDenom: string;
    gameId: string;
    deleted: boolean;
}
