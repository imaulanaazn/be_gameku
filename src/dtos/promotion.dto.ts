import { DiscountType } from "@enum/index";
import { MainDto } from "./main.dto";

export class PromotionDto extends MainDto {
    name: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase: number;
    description: string;
    publishAt: Date;
    startAt: Date;
    endAt: Date;
    deleted: boolean;
}
