import { MainDto } from "./main.dto";

export class AdminDto extends MainDto {
    name: string;
    role: string;
    username: string;
    password: string;
    lastLogin?: Date;
}
