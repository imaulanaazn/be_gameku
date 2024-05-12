import { MainService } from "./main.service";
import { OrderPending3rdPartyDto } from "src/dtos/index";
import { OrderPending3rdPartyEntity } from "@entity/index";

export class OrderPending3rdPartyService extends MainService<OrderPending3rdPartyEntity, OrderPending3rdPartyDto> {
    constructor() {
        super(OrderPending3rdPartyEntity);
    }
}
