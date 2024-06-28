import { MainDto } from "./main.dto";

export class AdminDto extends MainDto {
    name: string;
    username: string;
    password: string;
    deleted: boolean;
    // lastLogin?: Date;
}
