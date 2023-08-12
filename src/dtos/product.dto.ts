import { MainDto } from "./main.dto";

export class ProductDto extends MainDto {
    name: string;
    price: number;
    cd: string;
    gameId: string;
    deleted: boolean;
}
