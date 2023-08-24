import { MainService } from "./main.service";
import { ListServerDto } from "src/dtos/index";
import { ListServerEntity } from "@entity/index";

export class ListServerService extends MainService<ListServerEntity, ListServerDto> {
    constructor() {
        super(ListServerEntity);
    }
}
