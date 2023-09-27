export class Config {
    port = process.env.PORT || 3001;
    timezone = process.env.TZ;
    originCors = process.env.ORIGIN_CORS;
    databaseName = process.env.DB_NAME || "jokikugasskeun";
    databaseUsername = process.env.DB_USERNAME || "root";
    databasePassword = process.env.DB_PASSWORD || "P@ssw0rd";

    roleUser = process.env.ROLE_USER || "asdasdadwqfqwfwqafasd";
    roleAdmin = process.env.ROLE_ADMIN || "asdwqdwqdwhjqbsadwijqbd";
    roleGuest = process.env.ROLE_GUEST || "wqbdfpouqwbfpiqbfpndpqn";

    feUrl = process.env.FE_URL || "http://localhost:3000";

    redisUri = process.env.REDIS_URI;

    xenditSecretKey = process.env.XENDIT_SECRET_KEY;
    xenditBaseUrl = process.env.XENDIT_BASE_URL;
    secretSession = process.env.SECRET_SESSION;
    maxAgeGuest = parseInt(process.env.MAX_AGE_GUEST) || 60;
    maxAgeLogin = parseInt(process.env.MAX_AGE_LOGIN) || 60 * 60 * 24 * 3;

    bucketName = process.env.BUCKET_NAME || "gasskeun-topup.appspot.com";

    expiredTimeOtp = parseInt(process.env.EXPIRED_TIME_OTP) || 10;
}
