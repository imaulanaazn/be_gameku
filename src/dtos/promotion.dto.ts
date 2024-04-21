import { DiscountType, PromotionType } from "@enum/index";
import { MainDto } from "./main.dto";

export class PromotionDto extends MainDto {
    code: string;
    gameId?: string;
    name: string;
    type?: PromotionType;
    stock: number;
    discountType: DiscountType;
    discountValue: number;
    minPurchase: number;
    maxDiscount: number;
    description: string;
    startAt: Date;
    endAt: Date;
    deleted: boolean;
}
