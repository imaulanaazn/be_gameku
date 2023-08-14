import { MainDto } from "./main.dto";

export class ArticleDto extends MainDto {
    title: string;
    img: string;
    content: string;
    category: string;
    isExternal: boolean;
    externalUrl?: string;
    slug: string;
    isPublished: boolean;
    publishDate: Date;
}
