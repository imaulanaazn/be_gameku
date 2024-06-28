import { MainService } from "./main.service";
import { AdminRoleDto } from "src/dtos/index";
import { AdminRoleEntity } from "@entity/index";

export class AdminRoleService extends MainService<AdminRoleEntity, AdminRoleDto> {
    constructor() {
        super(AdminRoleEntity);
    }
}
