import { MainService } from "./main.service";
import { SocialMediaDto } from "src/dtos/index";
import { SocialMediaEntity } from "@entity/index";

export class SocialMediaService extends MainService<SocialMediaEntity, SocialMediaDto> {
    constructor() {
        super(SocialMediaEntity);
    }
}
