import { MainService } from "./main.service";
import { VideoDto } from "src/dtos/index";
import { VideoEntity } from "@entity/index";

export class VideoService extends MainService<VideoEntity, VideoDto> {
    constructor() {
        super(VideoEntity);
    }
}
