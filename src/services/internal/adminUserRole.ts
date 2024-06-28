import { MainService } from "./main.service";
import { AdminUserRoleDto } from "src/dtos/index";
import { AdminUserRoleEntity } from "@entity/index";

export class AdminUserRoleService extends MainService<AdminUserRoleEntity, AdminUserRoleDto> {
    constructor() {
        super(AdminUserRoleEntity);
    }
}
