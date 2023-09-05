import { MainService } from "./main.service";
import { SysConfigDto } from "src/dtos/index";
import { SysConfigEntity } from "@entity/index";

export class SysConfigService extends MainService<SysConfigEntity, SysConfigDto> {
    constructor() {
        super(SysConfigEntity);
    }
}
