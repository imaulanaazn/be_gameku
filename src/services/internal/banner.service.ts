import { MainService } from "./main.service";
import { BannerDto } from "src/dtos/index";
import { BannerEntity } from "@entity/index";

export class BannerService extends MainService<BannerEntity, BannerDto> {
    constructor() {
        super(BannerEntity);
    }
}
