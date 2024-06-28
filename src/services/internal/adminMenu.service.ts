import { MainService } from "./main.service";
import { AdminMenuDto } from "src/dtos/index";
import { AdminMenuEntity } from "@entity/index";

export class AdminMenuService extends MainService<AdminMenuEntity, AdminMenuDto> {
    constructor() {
        super(AdminMenuEntity);
    }
}
