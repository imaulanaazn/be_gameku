import { MainDto } from "./main.dto";

export class GameDto extends MainDto {
    name: string;
    logoUrl: string;
    platform: string;
    slug: string;
    deleted: boolean;
}
