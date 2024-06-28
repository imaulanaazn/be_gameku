import { Client } from "minio";
import fs, { readFileSync, unlinkSync } from "fs";
import { promisify } from "util";
import path from "path";
import { Config } from "@config/index";

const mkdir = promisify(fs.mkdir);
interface UploadFileParams {
    bucketName: string;
    filename: string;
    filePath?: string;
    fileBuffer?: Buffer;
    folder: string;
}

export class MinioService {
    private minioClient: Client;
    private uploadDir: string;

    constructor() {
        const config = new Config();
        this.minioClient = new Client({
            endPoint: config.minioUrl,
            port: config.minioPort,
            useSSL: false,
            accessKey: config.minioUsername,
            secretKey: config.minioPassword,
        });
        this.uploadDir = path.join(__dirname, "uploads");
    }

    private async ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            await mkdir(this.uploadDir, { recursive: true });
        }
    }

    public async uploadFile(data: UploadFileParams) {
        const { bucketName, filename, filePath, fileBuffer, folder } = data;

        await this.ensureUploadDir();

        const obj = `${folder}/${filename}`;
        if (fileBuffer) {
            return await this.uploadBuffer(bucketName, obj, fileBuffer);
        } else if (filePath) {
            try {
                const buffer = readFileSync(filePath);
                await this.uploadBuffer(bucketName, obj, buffer);
                unlinkSync(filePath);
            } catch (error) {
                throw new Error(`Error uploading or deleting file: ${error.message}`);
            }
        } else {
            throw new Error("Either fileBuffer or filePath must be provided");
        }
    }

    private async uploadBuffer(bucketName: string, filename: string, buffer: Buffer) {
        await this.minioClient.putObject(bucketName, filename, buffer);
    }

    public async getFile(
        data: Omit<UploadFileParams, "filePath" | "fileBuffer" | "folder"> & { result: "buffer" | "string" },
    ): Promise<Buffer | string> {
        try {
            const fileStream = await this.minioClient.getObject(data.bucketName, data.filename);
            const chunks: Buffer[] = [];
            const buffer: Buffer = await new Promise((resolve, reject) => {
                fileStream.on("data", (chunk) => chunks.push(chunk));
                fileStream.on("end", () => resolve(Buffer.concat(chunks)));
                fileStream.on("error", (error) => reject("File is not found"));
            });

            if (data.result === "buffer") {
                return buffer;
            }

            if (data.result === "string") {
                return this.bufferToString(buffer);
            }
        } catch (error) {
            return "File is not found";
        }
    }

    public async getFileUrl(
        data: Omit<UploadFileParams, "filePath" | "fileBuffer" | "folder"> & { expirySeconds?: number },
    ): Promise<string> {
        try {
            if (!data.expirySeconds) {
                data.expirySeconds = 60;
            }

            return await this.minioClient.presignedGetObject(data.bucketName, data.filename, data.expirySeconds);
        } catch (error) {
            throw new Error(`Error getting file URL: ${error.message}`);
        }
    }

    public bufferToString(buffer: Buffer): string {
        return buffer.toString("utf-8");
    }

    public async deleteFile(data: Omit<UploadFileParams, "filePath" | "fileBuffer" | "folder">): Promise<void> {
        try {
            await this.minioClient.removeObject(data.bucketName, data.filename);
        } catch (err) {
            console.error("Error menghapus file:", err);
        }
    }
}
