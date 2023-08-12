import { Config } from "@config/index";
import jwt from "jsonwebtoken";

export class ExternalJWTService {
    private accessToken: string;
    private refreshToken: string;

    constructor() {
        const config = new Config();
        (this.accessToken = config.jwtAccessToken), (this.refreshToken = config.jwtRefreshToken);
    }

    public createAccessToken(data: { id: string; rid: string }) {
        return jwt.sign(data, this.accessToken, {
            expiresIn: "7d",
        });
    }

    public createRefreshToken(data: { id: string; rid: string }) {
        return jwt.sign(data, this.refreshToken, {
            expiresIn: "30d",
        });
    }

    public verifyAccessToken(token: string) {
        return jwt.verify(token, this.accessToken);
    }

    public verifyRefreshToken(token: string) {
        return jwt.verify(token, this.refreshToken);
    }
}
