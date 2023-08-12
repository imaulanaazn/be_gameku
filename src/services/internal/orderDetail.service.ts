import { MainService } from "./main.service";
import { OrderDetailDto } from "src/dtos/index";
import { OrderDetailEntity } from "@entity/index";

export class OrderDetailService extends MainService<OrderDetailEntity, OrderDetailDto> {
    constructor() {
        super(OrderDetailEntity);
    }
}
