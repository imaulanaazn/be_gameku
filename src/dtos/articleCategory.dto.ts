import { MainDto } from "./main.dto";

export class ArticleCategoryDto extends MainDto {
    name: string;
    slug: string;
    description: string;
    deleted: boolean;
}
