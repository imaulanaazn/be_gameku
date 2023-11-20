export class OrderDetailDto {
    id: string;
    orderId: string;
    productId: string;
    userId: string;
    serverId: string;
    gameVoucher?: string;
    amount: number;
    quantity: number;
    webhookCount: number;
    username?: string;
}
