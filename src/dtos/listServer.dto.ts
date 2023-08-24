import { MainDto } from "./main.dto";

export class ListServerDto extends MainDto {
    gameId: string;
    label: string;
    value: string;
}
