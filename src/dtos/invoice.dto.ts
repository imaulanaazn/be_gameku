import { OrderStatuses } from "@enum/index";
import { MainDto } from "./main.dto";

export class InvoiceDto extends MainDto {
    xenditId: string;
    status: OrderStatuses;
    expiredAt: Date;
}
