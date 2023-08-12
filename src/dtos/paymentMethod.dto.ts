import { DurationCD, FeeType, PaymentsCategory } from "@enum/index";
import { MainDto } from "./main.dto";

export class PaymentMethodDto extends MainDto {
    name: string;
    minAmount: number;
    maxAmount: number;
    feeType: FeeType;
    cd: string;
    category: PaymentsCategory;
    isSingleUse: boolean;
    isActive: string;
    durationExpired: number;
    durationCd: DurationCD;
    logo: string;
}
