import { MainService } from "./main.service";
import { GameVoucherDto } from "src/dtos/index";
import { GameVoucherEntity } from "@entity/index";

export class GameVoucherService extends MainService<GameVoucherEntity, GameVoucherDto> {
    constructor() {
        super(GameVoucherEntity);
    }
}
