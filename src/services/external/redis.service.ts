import { Config } from "@config/index";
import { createClient, RedisClientType } from "redis";

export class RedisService {
    private client: RedisClientType;

    constructor() {
        const config = new Config();
        const url = `redis://:${config.redisPassword}@${config.redisHost}:${config.redisPort}`;
        this.client = createClient({
            url,
        });

        this.client.on("error", (err) => {
            console.error("Redis error:", err);
        });

        this.client.connect().catch(console.error);
    }

    async setObject(key: string, value: object, expirySeconds?: number): Promise<void> {
        const jsonString = JSON.stringify(value);
        if (expirySeconds) {
            await this.client.set(key, jsonString, { EX: expirySeconds });
        } else {
            await this.client.set(key, jsonString, { EX: 600 });
        }
    }

    async getObject<T>(key: string): Promise<T | null> {
        const jsonString = await this.client.get(key);
        if (jsonString) {
            return JSON.parse(jsonString) as T;
        }
        return null;
    }

    async set(key: string, value: string, expirySeconds?: number): Promise<void> {
        if (expirySeconds) {
            await this.client.set(key, value, { EX: expirySeconds });
        } else {
            await this.client.set(key, value, { EX: 600 });
        }
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const exists = await this.client.exists(key);
        return exists === 1;
    }

    async scanKeys(pattern: string): Promise<string[]> {
        const keys: string[] = [];
        const scanIterator = this.client.scanIterator({
            MATCH: pattern,
        });

        for await (const key of scanIterator) {
            keys.push(key);
        }

        return keys;
    }

    quit(): void {
        this.client.quit();
    }
}
