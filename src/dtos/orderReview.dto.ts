import { MainDto } from "./main.dto";

export class OrderReviewDto extends MainDto {
    orderId: string;
    mobileNumber: string;
    message: string;
    rating: number;
    hasUpdated?: boolean;
}
