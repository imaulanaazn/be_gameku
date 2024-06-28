import { MainDto } from "./main.dto";

export class ArticleImageDto extends MainDto {
    articleId: string;
    path: string;
    type: string;
}
