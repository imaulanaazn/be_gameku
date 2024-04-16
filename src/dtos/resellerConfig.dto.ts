import { MainDto } from "./main.dto";

export class ResellerConfigDto extends MainDto {
    resellerId: string;
    percentageMargin: number;
    apiKey: string;
    webhookApiKey: string;
    webhookCallbackUrl: string;
}
