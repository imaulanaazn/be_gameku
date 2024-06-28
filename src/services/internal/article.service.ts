import { MainService } from "./main.service";
import { ArticleDto } from "src/dtos/index";
import { ArticleEntity } from "@entity/index";

export class ArticleService extends MainService<ArticleEntity, ArticleDto> {
    constructor() {
        super(ArticleEntity);
    }
}
