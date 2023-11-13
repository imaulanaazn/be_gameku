import { Server } from "socket.io";
import { Client, LocalAuth } from "whatsapp-web.js";
import fs from "fs";
import { OrderDto } from "@dto/order.dto";
import randomatic from "randomatic";
import { Config } from "@config/index";
import dayjs from "dayjs";
import { WhatsappTemplateEntity } from "@entity/whatsappTemplate.entity";

interface IDataSendMessageOrder extends Partial<OrderDto> {
    link: string;
    quantity: number;
    mobileNumber: string;
    amount: number;
}

interface IDataSendMessageVoucher {
    gameName: string;
    voucher: string[];
    productName: string;
}

interface IDataSendMessageOtp {
    otp: string;
    expiredAt: string;
    expiredTime: number;
}

interface IParamSendMessage {
    targetNumber: string;
    message: WhatsappTemplateEntity;
    isTest: boolean;
}

interface IParamsSendNotifyAdmin {
    invoiceId: string;
}

interface IParamSendMessageOtp extends IParamSendMessage {
    data: IDataSendMessageOtp;
}
interface IParamSendMessageWithData extends IParamSendMessage {
    data?: IDataSendMessageOrder;
}

interface IParamSendMessageVoucher extends IParamSendMessage {
    data: IDataSendMessageVoucher;
}

interface IParamSendMessageNotifyAdmin extends IParamSendMessage {
    data: IParamsSendNotifyAdmin;
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
                    "--single-process",
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

            this.client.on("auth_failure", (msg) => {
                console.error(msg);
            });
        } catch (error) {
            console.log("[WHATSAPP] - Error during WhatsApp client initialization:");
            console.error(error);
        }
    }

    async sendNotifyOtp(data: IParamSendMessageOtp): Promise<{ success: boolean; msg: string }> {
        const content = data.message.content;
        const config = new Config();
        try {
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

            const replaceTemplate = content
                .toString()
                .replace(/\[otp\]/g, data.data.otp)
                .replace(/\[expired_time\]/g, data.data.expiredTime.toString() + " Menit")
                .replace(/\[expired_date\]/g, data.data.expiredAt);

            await this.client.sendMessage(numb, textMessage.replace(/\\n/g, "\n") + replaceTemplate);
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
        const content = data.message.content;

        const numb = "62" + data.targetNumber.slice(1) + "@c.us";
        try {
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

            const replaceTemplate = content
                .replace(/\[trx\]/g, data.data.invoiceId)
                .replace(/\[game\]/g, data.data.game)
                .replace(/\[denom\]/g, data.data.productName)
                .replace(/\[quantity\]/g, data.data.quantity.toString())
                .replace(/\[whatsapp\]/g, data.data.mobileNumber)
                .replace(/\[payment_method\]/g, data.data.paymentMethod)
                .replace(
                    /\[price\]/g,
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(data.data.amount),
                )
                .replace(
                    /\[fee\]/g,
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(data.data.feeAmt),
                )
                .replace(
                    /\[total\]/g,
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(data.data.totalAmt),
                )
                .replace(/\[link\]/g, data.data.link)
                .replace(/\[total_discount\]/g, data.data.discAmt.toString());
            await this.client.sendMessage(numb, textMessage.replace(/\\n/g, "\n") + replaceTemplate);
            console.log("[WHATSAPP] - SEND MESSAGE ORDER TO : " + data.targetNumber);
            return {
                success: true,
                msg: "",
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                msg: error.message,
            };
        }
    }

    async sendNotifyVoucher(data: IParamSendMessageVoucher): Promise<{ success: boolean; msg: string }> {
        const content = data.message.content;

        const numb = "62" + data.targetNumber.slice(1) + "@c.us";
        try {
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

            let newDataVoucher = [];

            for (const voucher of data.data.voucher) {
                if (voucher) {
                    newDataVoucher.push(`-. ${voucher}`);
                }
            }

            const formattedText = newDataVoucher.join("\n");
            const replaceTemplate = content
                .replace(/\[game\]/g, data.data.gameName)
                .replace(/\[denom\]/g, data.data.productName)
                .replace(/\[list_voucher\]/g, formattedText);
            await this.client.sendMessage(numb, textMessage.replace(/\\n/g, "\n") + replaceTemplate);
            console.log("[WHATSAPP] - SEND MESSAGE VOUCHER TO : " + data.targetNumber);
            return {
                success: true,
                msg: "",
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                msg: error.message,
            };
        }
    }

    async sendNotifyAdmin(data: IParamSendMessageNotifyAdmin) {
        const content = data.message.content;
        const numb = "62" + data.targetNumber.slice(1) + "@c.us";
        try {
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

            const replaceTemplate = content.replace(/\[invoiceId\]/g, data.data.invoiceId);
            await this.client.sendMessage(numb, textMessage.replace(/\\n/g, "\n") + replaceTemplate);
            console.log("[WHATSAPP] - SEND MESSAGE VOUCHER TO : " + data.targetNumber);
            return {
                success: true,
                msg: "",
            };
        } catch (error) {
            console.error(error);
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
