import { MainDto } from "./main.dto";

export class OrderReviewDto extends MainDto {
    orderId: string;
    gameId: string;
    productId: string;
    gameName: string;
    productName: string;
    mobileNumber: string;
    message: string;
    rating: number;
    hasUpdated?: boolean;
}
