import { ErrorType, TemplateMessage } from "@enum/index";
import { Server } from "socket.io";
import { Client, LocalAuth } from "whatsapp-web.js";
import fs from "fs";
import { BusinessError } from "@helper/handleError";
import { OrderDto } from "@dto/order.dto";
import randomatic from "randomatic";
import { Config } from "@config/index";
import dayjs from "dayjs";

interface IDataSendMessageOrder extends Partial<OrderDto> {
    link: string;
    quantity: number;
    mobileNumber: string;
    amount: number;
}

interface IParamSendMessage {
    targetNumber: string;
    template: TemplateMessage;
    isTest: boolean;
}

interface IParamSendMessageWithData extends IParamSendMessage {
    data?: IDataSendMessageOrder;
}

export class WhatsAppService {
    public client: Client;

    constructor(io: Server) {
        this.initializeClient(io);
    }

    private async initializeClient(io: Server) {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            restartOnAuthFail: true,
            puppeteer: {
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu",
                ],
            },
        });
        this.client.initialize();
        this.listenerClient(io);
    }

    private listenerClient(io: Server) {
        try {
            this.client.on("ready", () => {
                console.log("[WHATSAPP] - READY");
                io.emit("qrcode:status", { status: "CONNECTED", args: "WhatsApp Terhubung" });
            });

            this.client.on("disconnected", async (reason) => {
                console.log("[WHATSAPP] - DISCONNECTED : " + reason);
                io.emit("qrcode:status", {
                    status: "DISCONNECTED",
                    args: "Koneksi Whatsapp Terputus",
                });

                await this.client.initialize();
            });

            this.client.on("loading_screen", (percent, message) => {
                console.log("[WHATSAPP] - LOADING SCREEN : " + percent + " " + message);

                io.emit("qrcode:status", {
                    status: "CONNECTING",
                    args: "Menghubungkan ke Whatsapp",
                });
            });

            this.client.on("qr", (qr) => {
                console.log("[WHATSAPP] - QR CODE : " + qr);
                io.emit("qrcode:get", qr);
                io.emit("qrcode:status", { status: "SCANQR", args: "Scan QR Telebih dahulu" });
            });
        } catch (error) {
            console.log("[WHATSAPP] - Error during WhatsApp client initialization:");
            console.error(error);
        }
    }

    private getFile(path: string): string {
        if (!fs.existsSync(path)) {
            return undefined;
        }

        return fs.readFileSync(path, "utf-8");
    }

    async sendNotifyOtp(data: IParamSendMessage): Promise<{ success: boolean; msg: string }> {
        const config = new Config();
        const path = `./template/whatsapp/${data.template}.txt`;
        const file = this.getFile(path);
        if (!file) {
            return {
                success: false,
                msg: "File not found",
            };
        }
        const numb = "62" + data.targetNumber.slice(1) + "@c.us";
        const checkNumber = await this.client.isRegisteredUser(numb);
        if (!checkNumber) {
            return {
                success: false,
                msg: "User Belum Terdaftar Whatsapp",
            };
        }

        const otp = randomatic("0", 6);
        const expiredTime = config.expiredTimeOtp;
        const expiredDate = dayjs().add(expiredTime, "m").format("YYYY-MMMM-DD HH:mm:ss");

        let textMessage = "";
        if (data.isTest) {
            textMessage = textMessage + "HANYA TEST (TEXT INI TIDAK AKAN MUNCUL SELAIN UNTUK TEST)\n\n";
        }

        const replaceTemplate = file
            .toString()
            .replace("[otp]", otp)
            .replace("[expired_time]", expiredTime.toString() + " Menit")
            .replace("[expired_date]", expiredDate);

        try {
            await this.client.sendMessage(numb, textMessage + replaceTemplate);
            console.log("[WHATSAPP] - SEND MESSAGE OTP TO : " + data.targetNumber);
            return {
                success: true,
                msg: "",
            };
        } catch (error) {
            return {
                success: false,
                msg: error.message,
            };
        }
    }

    async sendNotifyOrder(data: IParamSendMessageWithData): Promise<{ success: boolean; msg: string }> {
        const path = `./template/whatsapp/${data.template}.txt`;
        const file = this.getFile(path);
        if (!file) {
            return {
                success: false,
                msg: "File not found",
            };
        }

        console.log("EXCUTED");
        const numb = "62" + data.targetNumber.slice(1) + "@c.us";
        const checkNumber = await this.client.isRegisteredUser(numb);
        if (!checkNumber) {
            return {
                success: false,
                msg: "User Belum Terdaftar Whatsapp",
            };
        }

        let textMessage = "";
        if (data.isTest) {
            textMessage = textMessage + "HANYA TEST (TEXT INI TIDAK AKAN MUNCUL SELAIN UNTUK TEST)\n\n";
        }

        try {
            const replaceTemplate = file
                .replace(/\[trx\]/g, data.data.invoiceId)
                .replace(/\[game\]/g, data.data.game)
                .replace(/\[denom\]/g, data.data.productName)
                .replace(/\[quantity\]/g, data.data.quantity.toString())
                .replace(/\[whatsapp\]/g, data.data.mobileNumber)
                .replace(/\[payment_method\]/g, data.data.paymentMethod)
                .replace(/\[price\]/g, data.data.amount.toString())
                .replace(/\[fee\]/g, data.data.feeAmt.toString())
                .replace(/\[total\]/g, data.data.totalAmt.toString())
                .replace(/\[link\]/g, data.data.link);
            await this.client.sendMessage(numb, textMessage + replaceTemplate);
            console.log("[WHATSAPP] - SEND MESSAGE ORDER TO : " + data.targetNumber);
            return {
                success: true,
                msg: "",
            };
        } catch (error) {
            console.log(error);
            return {
                success: false,
                msg: error.message,
            };
        }
    }

    async checkConnection(): Promise<string | boolean> {
        try {
            const state = await this.client.getState();
            console.log("[WHATSAPP] - CHECK CONNECTION : " + state);
            return state;
        } catch (error) {
            console.log("[WHATSAPP] - Error WhatsApp Check Connection");
            console.error(error);
            return false;
        }
    }
}
