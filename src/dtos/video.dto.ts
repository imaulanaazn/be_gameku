import { MainDto } from "./main.dto";

export class VideoDto extends MainDto {
    title: string;
    author: string;
    authorUrl: string;
    url: string;
    videoId: string;
}

export class YoutubeDataDto {
    url: string;
    thumbnail_height: number;
    version: string;
    author_name: string;
    thumbnail_url: string;
    author_url: string;
    title: string;
    height: number;
    provider_url: string;
    type: string;
    html: string;
    thumbnail_width: number;
    width: number;
    provider_name: string;
}
