export class Config {
    port = process.env.PORT || 3001;
    timezone = process.env.TZ;
    originCors = process.env.ORIGIN_CORS || "*";
    databaseName = process.env.DB_NAME || "jokikugasskeun";
    databaseUsername = process.env.DB_USERNAME || "root";
    databasePassword = process.env.DB_PASSWORD || "P@ssw0rd";

    roleUser = process.env.ROLE_USER || "asdasdadwqfqwfwqafasd";
    roleAdmin = process.env.ROLE_ADMIN || "wqbdfpouqwbfpiqbfpndpqn";
    roleGuest = process.env.ROLE_GUEST || "wqbdfpouqwbfpiqbfpndpqn";

    successRedirectUrl = process.env.SUCCESS_REDIRECT_URL || "http://localhost:3000/success";
    failedRedirectUrl = process.env.SUCCESS_REDIRECT_URL || "http://localhost:3000/failed";

    smtpSender = process.env.SMTP_SENDER;
    smtpHost = process.env.SMTP_HOST;
    smtpPort = process.env.SMTP_PORT;
    smtpUsername = process.env.SMTP_USERNAME;
    smtpPassword = process.env.SMTP_PASSWORD;

    jwtAccessToken = process.env.JWT_ACCESS_TOKEN || "adqgqffasdasd";
    jwtRefreshToken = process.env.JWT_REFRESH_TOKEN || "dqwdasdasdwqdwqdadasdasdasdsadqwdwqd";

    redisUri = process.env.REDIS_URI;

    recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

    xenditSecretKey = process.env.XENDIT_SECRET_KEY;
    xenditBaseUrl = process.env.XENDIT_BASE_URL;
    secretSession = process.env.SECRET_SESSION;
    secretMaxAge = parseInt(process.env.MAX_AGE_SESSION) || 1000 * 60 * 60 * 24 * 3;

    bucketName = process.env.BUCKET_NAME || "gasskeun-topup.appspot.com";
}
