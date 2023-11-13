import { MainService } from "./main.service";
import { CustomerOtpDto } from "src/dtos/index";
import { CustomerOtpEntity } from "@entity/index";

export class CustomerOtpService extends MainService<CustomerOtpEntity, CustomerOtpDto> {
    constructor() {
        super(CustomerOtpEntity);
    }
}
