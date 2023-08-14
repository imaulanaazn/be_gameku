import { MainService } from "./main.service";
import { CommentDto } from "src/dtos/index";
import { CommentEntity } from "@entity/index";

export class CommentService extends MainService<CommentEntity, CommentDto> {
    constructor() {
        super(CommentEntity);
    }
}
