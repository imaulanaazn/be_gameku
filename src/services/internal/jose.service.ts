import { CompactJWEHeaderParameters, KeyLike } from "jose";
import fs from "fs";
import * as jose from "jose";
import { BusinessError } from "@helper/handleError";
import { ErrorType } from "@enum/index";
import dayjs from "dayjs";
import path from "path";

type DateExpired = "day" | "hour" | "minute" | "second" | "millisecond" | "month" | "week" | "year";

export class EncryptionService {
    private privateKey: string;
    private publicKey: string;

    constructor() {
        const runningFolder = process.env.NODE_ENV.toLowerCase() === "production" ? "dist" : "src";
        const keyPath = path.join(process.cwd(), runningFolder, "key");
        this.privateKey = fs.readFileSync(path.join(keyPath, "private.pem"), "utf8");
        this.publicKey = fs.readFileSync(path.join(keyPath, "public.pem"), "utf8");
    }

    private async getSecretKey(): Promise<{ privateKey: KeyLike; publicKey: KeyLike }> {
        try {
            const privateKey = await jose.importPKCS8(this.privateKey, "RSA-OAEP-256");
            const publicKey = await jose.importSPKI(this.publicKey, "RSA-OAEP-256");
            return {
                privateKey,
                publicKey,
            };
        } catch (error) {
            console.error("Error during initialization:", error);
        }
    }

    async encryptData(data: any, timeExpired: number, dateExpired: DateExpired): Promise<string> {
        try {
            const { publicKey } = await this.getSecretKey();
            return await new jose.CompactEncrypt(
                new TextEncoder().encode(
                    JSON.stringify({
                        data,
                        expiredAt: dayjs().add(timeExpired, dateExpired).toISOString(),
                        createdAt: dayjs().toISOString(),
                    }),
                ),
            )
                .setProtectedHeader({ alg: "RSA-OAEP-256", enc: "A256GCM" })
                .encrypt(publicKey);
        } catch (error) {
            console.log(error.message);
            console.log("@@ Error from encrypt Data with JWE");
            throw new BusinessError("Cannot access to this resource", ErrorType.Authorization);
        }
    }

    async decryptData<T>(jwe: string): Promise<{ data: T; expiredAt: string; createdAt: string; isExpired: boolean }> {
        try {
            const { privateKey } = await this.getSecretKey();
            const { plaintext } = await jose.compactDecrypt(jwe, privateKey);
            const data = JSON.parse(new TextDecoder().decode(plaintext));
            let isExpired = false;
            if (dayjs(data.expiredAt).isBefore(dayjs())) {
                isExpired = true;
            }

            return {
                isExpired,
                ...JSON.parse(new TextDecoder().decode(plaintext)),
            };
        } catch (error) {
            console.log(error.message);
            console.log("@@ Error from encrypt Data with JWE");
            throw new BusinessError("Cannot access to this resource", ErrorType.Authorization);
        }
    }
}
