export enum ErrorType {
    BadRequest = "BadRquestError",
    Authentication = "AuthenticationError",
    Authorization = "AuthorizationError",
    Validation = "ValidationError",
    NotFound = "NotFoundError",
    Internal = "InternalServerError",
    Duplicate = "DuplicateError",
    ToManyRequest = "ToManyRequest",
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
}
export enum OrderStatuses {
    UNPAID = "1",
    PAID = "2",
    EXPIRED = "3",
    FAILED = "4",
    PARTIAL_PAID = "5",
}

export enum OrderType {
    BUY = "1",
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
}
