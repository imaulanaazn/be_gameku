// import { ErrorType, ValidatorType } from "@enum/index";
// import { BusinessError } from "@helper/handleError";
// import { Validator } from "@helper/validator";
// import { IApiRouter, Validation } from "@interfaces/index";
// import { RequestHandler } from "express";

// const path = "/v1/whatsapp";
// const method = "POST";
// const auth = "guess";

// const schemaValidation: Validation[] = [
//     {
//         name: "mobileNumber",
//         type: "string",
//         required: true,
//         isMobileNo: true,
//     },
//     {
//         name: "message",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "template",
//         type: "string",
//         required: false,
//     },
// ];

// const main: RequestHandler = async (req, res) => {
//     const client = req.client;
//     const io = req.io;

//     const connection = await client.checkConnection();
//     if (!connection) {
//         client.getQrCode(io);
//         throw new BusinessError("Whatsapp tidak aktif, tunggu beberapa saat untuk scan QR", ErrorType.NotFound);
//     }

//     res.send({
//         message: "Whatsapp terhubung",
//     });
// };

// export const getWhatsappStatus: IApiRouter = {
//     main,
//     path,
//     method,
//     auth,
// };
