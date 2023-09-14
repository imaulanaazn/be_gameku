import { DiscountType } from "@enum/index";
import { MainDto } from "./main.dto";

export class PromotionDto extends MainDto {
    code: string;
    gameId?: string;
    name: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase: number;
    description: string;
    startAt: Date;
    endAt: Date;
    deleted: boolean;
}
