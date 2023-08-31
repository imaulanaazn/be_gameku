import { OrderStatuses } from "@enum/index";
import { MainDto } from "./main.dto";

export class OrderDto extends MainDto {
    invoiceId: string;
    customerId: string;
    paymentMethodId: string;
    game: string;
    productName: string;
    paymentMethod: string;
    totalAmt: number;
    feeAmt: number;
    discAmt: number;
    promoCd: string;
    status: OrderStatuses;
    completedAt?: Date | string;
}
