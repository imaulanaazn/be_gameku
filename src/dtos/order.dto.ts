import { OrderStatuses, OrderType } from "@enum/index";
import { MainDto } from "./main.dto";

export class OrderDto extends MainDto {
    promoId: string;
    type: OrderType;
    invoiceId: string;
    extTrxId?: string;
    customerId: string;
    paymentMethodId: string;
    game: string;
    productName: string;
    paymentMethod: string;
    amtBuy?: number;
    totalAmt: number;
    feeAmt: number;
    discAmt: number;
    promoCd: string;
    status: OrderStatuses;
    completedAt?: Date | string;
    isError?: boolean;
    isCanResend?: boolean;
    remark?: string;
    ipAddress?: string;
    isNew: boolean;
    countMessagePending?: number;
}
