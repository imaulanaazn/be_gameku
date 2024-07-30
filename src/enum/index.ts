export enum ErrorType {
    BadRequest = "BadRquestError",
    Authentication = "AuthenticationError",
    Authorization = "AuthorizationError",
    Validation = "ValidationError",
    NotFound = "NotFoundError",
    Internal = "InternalServerError",
    Duplicate = "DuplicateError",
    ToManyRequest = "ToManyRequest",
    Locked = "LockedError",
}

export enum ErrorStatusCode {
    BadRequest = 400,
    Authentication = 401,
    Authorization = 403,
    Validation = 422,
    NotFound = 404,
    Internal = 500,
    Duplicate = 409,
    ToManyRequest = 429,
    Locked = 423,
}
export enum OrderStatuses {
    PENDING_PAYMENT = "1",
    PENDING_ORDER = "2",
    SUCCESS = "3",
    FAILED = "4",
    EXPIRED = "5",
    PROCESSING = "6",
}

export enum APIGamesStatuses {
    PENDING = "Pending",
    SUCCESS = "Sukses",
    FAILED = "Gagal",
    PROCESSING = "Proses",
    PARTIAL = "Sukses Sebagian",
    ERROR = "Validasi Provider",
}

export enum DigiflazzStatuses {
    PENDING = "Pending",
    SUCCESS = "Sukses",
    FAILED = "Gagal",
}

export enum InvoiceStatuses {
    PENDING = "1",
    PAID = "2",
    EXPIRED = "3",
    FAILED = "4",
}

export enum OrderType {
    BUY = "1",
    SELL = "2",
    TOPUP = "3",
}

export enum OTPType {
    REGISTRATION = "1",
    LOGIN = "2",
    RESET_PASSWORD = "3",
}

export enum ValidatorType {
    QUERY = "query",
    PARAMS = "params",
    BODY = "body",
}

export enum DurationCD {
    SECOND = "s",
    MINUTE = "m",
    HOUR = "h",
    DAY = "d",
    MONTH = "M",
    YEAR = "y",
}

export enum DiscountType {
    PERCENTAGE = "percentage",
    AMOUNT = "amount",
}

export enum FeeType {
    PERCENTAGE = "percentage",
    AMOUNT = "amount",
}

export enum PaymentsCategory {
    EWALLET = "1",
    QRIS = "2",
    VIRTUAL_ACCOUNT = "3",
    RETAIL = "4",
    INTERNAL = "5",
    PULSA = "6",
}

export enum EncryptJoseType {
    RESELLER = "reseller",
    ADMIN = "admin",
    USER = "user",
}

export enum TypeOverview {
    DAYLY = 1,
    WEEKLY = 7,
    MONTHLY = 30,
    YEARLY = 365,
}

export enum VoucherType {
    INTERNAL = "internal",
    EXTERNAL = "external",
}

export enum ServerIdType {
    INPUT = "input",
    LIST = "list",
}

export enum TemplateMessage {
    OTP_LOGIN = "otp_login",
    OTP_REGISTER = "otp_register",
    ORDER_FAILED = "order_failed",
    ORDER_SUCCESS = "order_success",
    ORDER_PENDING = "order_pending",
}

export enum SysConfigCD {
    XENDIT_SECRET_KEY = "api_key",
    XENDIT_WEBHOOK_KEY = "webhook_key",
}

export enum PromotionType {
    USER = "user",
    RESELLER = "reseller",
    ALL = "all",
}

export enum GameProvider {
    MANUAL = "MANUAL",
    APIGAMES = "API_GAMES",
}

export enum OrderScope {
    WITH_AMT_BUY = "withAmtBuy",
    LOGGING = "logging",
}

export enum CustomerStatuses {
    ACTIVE = "active",
    FREEZE = "freeze",
    SUSPENDED = "suspended",
}
