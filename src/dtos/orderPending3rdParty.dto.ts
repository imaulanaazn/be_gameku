import { MainDto } from "./main.dto";

export class OrderPending3rdPartyDto extends MainDto {
    providerId: string;
    extInvoiceNumber: string;
}
