import { createClient } from "redis";
import { Config } from "@config/index";

class RedisService {
    private redisClient;

    constructor() {
        const config = new Config();

        this.redisClient = createClient({
            host: config.redisHost,
            port: config.redisPort,
        });

        this.redisClient.on("error", (err) => console.error("Redis Client Error", err));
    }

    public async setJson(key: string, value: any, ttl?: number): Promise<any> {
        if (!ttl) {
            ttl = 60 * 5;
        }
        const jsonValue = JSON.stringify(value);
        return await this.set(key, jsonValue, ttl);
    }

    public async getJson<T>(key: string): Promise<T> {
        const value = await this.get(key);
        if (!value) {
            return null;
        }

        return JSON.parse(value) as T;
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (ttl) {
                this.redisClient.set(key, value, "EX", ttl, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            } else {
                this.redisClient.set(key, value, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            }
        });
    }

    public async get(key: string): Promise<string> {
        return await new Promise<string>((resolve, reject) => {
            this.redisClient.get(key, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }

    public async del(key: string): Promise<number> {
        return await new Promise<number>((resolve, reject) => {
            this.redisClient.del(key, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }

    public async scanKeys(pattern: string): Promise<string[]> {
        const foundKeys: string[] = [];
        let cursor = "0";

        do {
            const result = await new Promise<{ cursor: string; keys: string[] }>((resolve, reject) => {
                this.redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100, (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ cursor: response[0], keys: response[1] });
                    }
                });
            });
            cursor = result.cursor;
            foundKeys.push(...result.keys);
        } while (cursor !== "0");

        return foundKeys;
    }
}

export default RedisService;
