import { MainService } from "./main.service";
import { WhatsappTemplateDto } from "src/dtos/index";
import { WhatsappTemplateEntity } from "@entity/index";

export class WhatsappTemplateService extends MainService<WhatsappTemplateEntity, WhatsappTemplateDto> {
    constructor() {
        super(WhatsappTemplateEntity);
    }
}
