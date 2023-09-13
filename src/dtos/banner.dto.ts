import { MainDto } from "./main.dto";

export class BannerDto extends MainDto {
    name: string;
    imageUrl: string;
    eventUrl: string;
    external: boolean;
}
