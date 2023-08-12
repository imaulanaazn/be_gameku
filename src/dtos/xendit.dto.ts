interface Basket {
    reference_id: string;
    name: string;
    category: string;
    currency: string;
    price: number;
    quantity: number;
    type: string;
    url?: string;
    description?: string;
    sub_category?: string;
    metadata?: object;
}

export interface XenditCreateEwalletDto {
    reference_id: string;
    currency: "IDR";
    amount: number;
    checkout_method: "ONE_TIME_PAYMENT" | "TOKENIZED_PAYMENT";
    channel_code?: string;
    channel_properties?: {
        mobile_number?: string;
        cashtag?: string;
        success_redirect_url?: string;
    };
    payment_method_id?: string;
    customer_id?: string;
    basket?: Basket[];
    metadata?: object;
}

export interface XenditCreateQRISDto {
    reference_id: string;
    type: "DYNAMIC" | "STATIC";
    currency: "IDR";
    amount: number;
    channel_code?: string;
    expires_at?: string;
    basket?: Basket[];
    metadata?: object;
}

export interface XenditCreateVADto {
    external_id: string;
    bank_code: string;
    name: string;
    virtual_account_number?: string;
    country?: "ID";
    currency?: "IDR";
    is_single_use?: boolean;
    is_closed?: boolean;
    expected_amount?: number;
    min_amount?: number;
    max_amount?: number;
    suggested_amount?: number;
    expiration_date: string;
    description?: string;
}

export interface XenditCreateRetailDto {
    external_id: string;
    retail_outlet_name: string;
    name: string;
    expected_amount: number;
    payment_code?: string;
    expiration_date: string;
    is_single_use?: boolean;
}
