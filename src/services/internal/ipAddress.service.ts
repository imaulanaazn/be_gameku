import { MainService } from "./main.service";
import { IPAddressDto } from "src/dtos/index";
import { IPAddressEntity } from "@entity/index";

export class IPAddressService extends MainService<IPAddressEntity, IPAddressDto> {
    constructor() {
        super(IPAddressEntity);
    }
}
