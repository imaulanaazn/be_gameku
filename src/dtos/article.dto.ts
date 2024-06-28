import { MainDto } from "./main.dto";

export class ArticleDto extends MainDto {
    authorId: string;
    title: string;
    slug: string;
    content: string;
    contentPreview: string;
    status: string;
    isPopular: boolean;
    // seqPop?: number;
    publishedAt: Date;
}
