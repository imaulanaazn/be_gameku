import { MainDto } from "./main.dto";

export class OrderReviewDto extends MainDto {
    orderId: string;
    message: string;
    rating: number;
    hasUpdated?: boolean;
}
