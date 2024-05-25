import { DurationCD, FeeType, PaymentsCategory } from "@enum/index";
import { MainDto } from "./main.dto";

export class PaymentMethodDto extends MainDto {
    providerCd: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    feeType: FeeType;
    cd: string;
    category: PaymentsCategory;
    isSingleUse: boolean;
    isActive: boolean;
    durationExpired: number;
    durationCd: DurationCD;
    logo: string;
    deleted?: boolean;
    paymentGuide: string;
}
