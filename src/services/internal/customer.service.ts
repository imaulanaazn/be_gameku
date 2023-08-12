import { MainService } from "./main.service";
import { CustomerDto } from "src/dtos/index";
import { CustomerEntity } from "@entity/index";

export class CustomerService extends MainService<CustomerEntity, CustomerDto> {
    constructor() {
        super(CustomerEntity);
    }
}
