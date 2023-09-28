import { AdminDto } from "@dto/admin.dto";
import { CustomerDto } from "@dto/customer.dto";
import { WhatsAppService } from "@serviceExternal/whatsapp.service";
import { Session } from "express-session";
import { Server } from "socket.io";

declare module "express-session" {
    export interface SessionData {
        data: {
            roleId: string;
            isLogin: boolean;
            ip: string;
            userData?: CustomerDto | AdminDto;
        };
    }
}

declare module "express-serve-static-core" {
    interface Request {
        io?: Server;
        client?: WhatsAppService;
    }
}
