import { InvoiceStatuses, OrderStatuses } from "@enum/index";
import { MainDto } from "./main.dto";

export class IPAddressDto extends MainDto {
    ip: string;
    cd: string;
    value: string;
    status: string;
}
