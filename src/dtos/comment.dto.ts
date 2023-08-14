import { MainDto } from "./main.dto";

export class CommentDto extends MainDto {
    artileId: string;
    name: string;
    text: string;
    deletd: boolean;
}
