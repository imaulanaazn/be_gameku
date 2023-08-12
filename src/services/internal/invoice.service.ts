import { MainService } from "./main.service";
import { InvoiceDto } from "src/dtos/index";
import { InvoiceEntity } from "@entity/index";

export class InvoiceService extends MainService<InvoiceEntity, InvoiceDto> {
    constructor() {
        super(InvoiceEntity);
    }
}
