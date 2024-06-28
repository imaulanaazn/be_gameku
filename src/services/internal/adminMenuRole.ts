import { MainService } from "./main.service";
import { AdminMenuRoleDto } from "src/dtos/index";
import { AdminMenuRoleEntity } from "@entity/index";

export class AdminMenuRoleService extends MainService<AdminMenuRoleEntity, AdminMenuRoleDto> {
    constructor() {
        super(AdminMenuRoleEntity);
    }
}
