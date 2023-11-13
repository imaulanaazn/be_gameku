import { MainDto } from "./main.dto";

export class MetaDto extends MainDto {
    path: string;
    title: string;
    slug: string;
    description: string;
    keywords: string;
    icon: string;
    image: string;
}
