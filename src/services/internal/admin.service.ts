import { MainService } from "./main.service";
import { AdminDto } from "src/dtos/index";
import { AdminEntity } from "@entity/index";

export class AdminService extends MainService<AdminEntity, AdminDto> {
    constructor() {
        super(AdminEntity);
    }

    async findUserWithAllAttr<K extends keyof AdminDto>(column: K, value: AdminDto[K]): Promise<AdminEntity> {
        return await this.model.scope("withPassword").findOne({
            where: {
                [column]: value,
            },
        });
    }
}
