import { MainService } from "./main.service";
import { MetaDto } from "src/dtos/index";
import { MetaEntity } from "@entity/index";

export class MetaService extends MainService<MetaEntity, MetaDto> {
    constructor() {
        super(MetaEntity);
    }
}
