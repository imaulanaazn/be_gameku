import { MainDto } from "./main.dto";

export class ProductDto extends MainDto {
    name: string;
    price: number;
    cd: string;
    unit: number;
    unitBonus: number;
    logoDenom: string;
    gameId: string;
    deleted: boolean;
}
