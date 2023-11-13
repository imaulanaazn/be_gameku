import { MainDto } from "./main.dto";

export class CustomerOtpDto extends MainDto {
    mobileNumber: string;
    type: string;
    otp: string;
    category: string;
    expiredAt: Date;
}
