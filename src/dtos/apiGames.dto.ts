export class CheckGameAccount {
    status: number;
    rc: number;
    message: string;
    data: {
        is_valid: boolean;
        username: string;
    };
    ts: number;
}

export class PostTransactionDto {
    invoiceId: string;
    merchantId?: string;
    productCode: string;
    userId: string;
    serverId?: string;
    signature?: string;
}

export class ResponseTransactionSuccessDto {
    data: {
        merchant_id: string;
        trx_id: string;
        ref_id: string;
        destination: string;
        product_code: string;
        product_code_master: string;
        message: string;
        status: string;
        sn: string;
        last_balance: string;
        product_detail: {
            name: string;
            code: string;
            price: number;
            price_unit: string;
            rate: number;
            price_rp: number;
        };
    };
    status: number;
}

export class ResponseTransactionErrorDto {
    error_msg: string;
    status: number;
}
