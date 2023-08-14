import { MainService } from "./main.service";
import { CustomerDto } from "src/dtos/index";
import { CustomerEntity } from "@entity/index";

export class CustomerService extends MainService<CustomerEntity, CustomerDto> {
    constructor() {
        super(CustomerEntity);
    }

    async findUserWithPasswordBy<K extends keyof CustomerDto>(
        column: K,
        value: CustomerDto[K],
    ): Promise<CustomerEntity> {
        return await this.model.scope("withPassword").findOne({
            where: {
                [column]: value,
            },
        });
    }
}
