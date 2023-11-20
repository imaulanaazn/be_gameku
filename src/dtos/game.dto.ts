import { ServerIdType, VoucherType } from "@enum/index";
import { MainDto } from "./main.dto";

export class GameDto extends MainDto {
    categoryId: string;
    name: string;
    automatically: boolean;
    cd: string;
    logoUrl: string;
    isPopular: boolean;
    popSequence?: number;
    slug: string;
    logoDenom?: string;
    deleted: boolean;
    needServerId?: boolean;
    needCheckId?: boolean;
    typeServerId?: ServerIdType;
    type: string;
    voucherType?: VoucherType;
    description: string;
}
