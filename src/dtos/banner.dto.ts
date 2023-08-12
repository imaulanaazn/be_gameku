import { MainDto } from "./main.dto";

export class BannerDto extends MainDto {
    imageUrl: string;
    eventUrl: string;
    external: boolean;
}
