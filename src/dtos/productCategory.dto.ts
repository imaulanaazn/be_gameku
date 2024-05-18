import { DiscountType, PromotionType } from "@enum/index";
import { MainDto } from "./main.dto";

export class ProductCategoryDto extends MainDto {
    gameId: string;
    name: string;
    catSequence: number;
}
