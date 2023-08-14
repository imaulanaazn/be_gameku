import { MainDto } from "./main.dto";

export class GameDto extends MainDto {
    name: string;
    logoUrl: string;
    platform: string;
    category: string;
    isPopular: boolean;
    popSequence?: number;
    slug: string;
    deleted: boolean;
}
