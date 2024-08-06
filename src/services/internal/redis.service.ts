// import { Config } from "@config/index";
// import redis, { RedisClient } from "redis";
// import { promisify } from "util";

// class RedisService {
//     private client: RedisClient;
//     private hgetallAsync: (key: string) => Promise<{ [key: string]: string }>;
//     private hmsetAsync: (key: string, ...args: any[]) => Promise<unknown>;
//     private delAsync: (key: string) => Promise<unknown>;

//     constructor() {
//         const config = new Config();
//         this.client = redis.createClient({
//             host: config.redisHost, // Sesuaikan dengan konfigurasi Redis Anda
//             port: config.redisPort,
//         });

//         this.hgetallAsync = promisify(this.client.hgetall).bind(this.client);
//         this.hmsetAsync = promisify(this.client.hmset).bind(this.client);
//         this.delAsync = promisify(this.client.del).bind(this.client);
//     }

//     async getHashAll(key: string): Promise<{ [key: string]: string }> {
//         return this.hgetallAsync(key);
//     }

//     async setHash(key: string, ...args: any[]): Promise<unknown> {
//         return this.hmsetAsync(key, ...args);
//     }

//     async deleteKey(key: string): Promise<unknown> {
//         return this.delAsync(key);
//     }
// }

// export default RedisService;
