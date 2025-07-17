// import { MainService } from "./main.service";
// import { VideoDto, YoutubeDataDto } from "src/dtos/index";
// import { VideoEntity } from "@entity/index";

// export class VideoService extends MainService<VideoEntity, VideoDto> {
//     constructor() {
//         super(VideoEntity);
//     }

//     async getData(url: string): Promise<YoutubeDataDto> {
//         try {
//             const req = await fetch("https://noembed.com/embed?dataType=json&url=" + url);
//             const res = await req.json();
//             if (!res.error) {
//                 return res;
//             }
//         } catch (error) {
//             console.error(error);
//         }
//     }
// }
