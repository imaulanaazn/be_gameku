import { MainDto } from "./main.dto";

export class GameVoucherDto extends MainDto {
    gameId: string;
    productId: string;
    code: string;
    used: boolean;
    deleted: boolean;
}
