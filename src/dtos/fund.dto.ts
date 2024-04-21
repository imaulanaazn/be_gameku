import { MainDto } from "./main.dto";

export class FundDto extends MainDto {
    customerId: string;
    name: string;
    value: number;
}
