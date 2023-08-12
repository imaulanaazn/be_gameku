import { MainService } from "./main.service";
import { PaymentMethodDto } from "src/dtos/index";
import { PaymentMethodEntity } from "@entity/index";

export class PaymentMethodService extends MainService<PaymentMethodEntity, PaymentMethodDto> {
    constructor() {
        super(PaymentMethodEntity);
    }
}
