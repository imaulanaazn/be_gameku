import { MainService } from "./main.service";
import { FundDto } from "src/dtos/index";
import { FundEntity } from "@entity/index";

export class FundService extends MainService<FundEntity, FundDto> {
    constructor() {
        super(FundEntity);
    }
}
