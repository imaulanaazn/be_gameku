import { MainService } from "./main.service";
import { OrderDto } from "src/dtos/index";
import { OrderEntity } from "@entity/index";

export class OrderService extends MainService<OrderEntity, OrderDto> {
    constructor() {
        super(OrderEntity);
    }
}
