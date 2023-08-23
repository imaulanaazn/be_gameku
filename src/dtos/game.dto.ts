import { MainDto } from "./main.dto";

export class GameDto extends MainDto {
    categoryId: string;
    name: string;
    logoUrl: string;
    isPopular: boolean;
    popSequence?: number;
    slug: string;
    logoDenom: string;
    deleted: boolean;
}
