import { MainService } from "./main.service";
import { ProviderDto } from "src/dtos/index";
import { ProviderEntity } from "@entity/index";

export class ProviderService extends MainService<ProviderEntity, ProviderDto> {
    constructor() {
        super(ProviderEntity);
    }
}
