// import { WhatsAppService } from "@serviceExternal/whatsapp.service";
// import { Server, Socket } from "socket.io";

// const handleConnectionStatus = async (io: Server, client: WhatsAppService) => {
//     const connection = await client.checkConnection();
//     let status;
//     let args;

//     if (connection === null) {
//         status = "CHECKING";
//         args = "Mengecek status WhatsApp";
//     } else if (connection === "CONNECTED") {
//         status = "CONNECTED";
//         args = "WhatsApp Terhubung";
//     } else {
//         status = "DISCONNECTED";
//         args = "Menunggu QR Code";
//     }

//     io.emit("qrcode:status", { status, args });
// };

// const routerIo = async (io: Server, socket: Socket, client: WhatsAppService) => {
//     socket.on("whatsapp:logout", async () => {
//         await client.client.logout();
//         io.emit("qrcode:status", {
//             status: "LOGOUT",
//             args: "Memproses logout whatsapp",
//         });
//         await client.client.initialize();
//     });

//     socket.on("qrcode:check", () => {
//         handleConnectionStatus(io, client);
//     });
// };

// export default routerIo;
