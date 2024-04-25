import { MainService } from "./main.service";
import { OrderReviewDto } from "src/dtos/index";
import { OrderReviewEntity } from "@entity/index";

export class OrderReviewService extends MainService<OrderReviewEntity, OrderReviewDto> {
    constructor() {
        super(OrderReviewEntity);
    }
}
