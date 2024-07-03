import { MainDto } from "./main.dto";

export class ArticleCommentDto extends MainDto {
    articleId: string;
    name: string;
    email: string;
    content: string;
    status: string;
    ip: string;
}
