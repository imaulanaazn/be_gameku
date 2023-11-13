import { InvoiceStatuses, OrderStatuses } from "@enum/index";
import { MainDto } from "./main.dto";

export class InvoiceDto extends MainDto {
    xenditId?: string;
    status: InvoiceStatuses;
    expiredAt: Date;
}
