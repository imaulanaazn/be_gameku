import { MainDto } from "./main.dto";

export class CustomerDto extends MainDto {
    roleId: string;
    isRegistered: boolean;
    name?: string;
    email?: string;
    mobileNumber: string;
    password?: string;
    isActive: boolean;
}
