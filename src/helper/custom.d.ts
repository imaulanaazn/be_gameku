import { CustomerDto } from "@dto/customer.dto";
import { Session } from "express-session";

declare module "express-session" {
    export interface SessionData {
        data: {
            roleId: string;
            isLogin: boolean;
            ip: string;
            userData?: CustomerDto;
        };
    }
}
