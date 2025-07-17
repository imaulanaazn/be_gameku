// import { APIAuth, APIMethod, EncryptJoseType, ErrorType, JoseKey, ValidatorType } from "@enum/index";
// import { BusinessError } from "@helper/handleError";
// import { Validator } from "@helper/validator";
// import { Validation, IApiRouter } from "@interfaces/index";
// import { CustomerService } from "@serviceInternal/customer.service";
// import { RequestHandler } from "express";
// import { Config } from "@config/index";
// import { CustomerEntity } from "@entity/customer.entity";
// import { EncryptionService } from "@serviceInternal/jose.service";
// import { CustomerOtpService } from "@serviceInternal/customerOtp.service";
// import dayjs from "dayjs";
// import { ResellerConfigService } from "@serviceInternal/resellerConfig.service";
// import { v4 as uuid } from "uuid";

// const path = "/v1/reseller/login";
// const method = APIMethod.POST;
// const auth = APIAuth.GUEST;

// const schemaValidation: Validation[] = [
//     {
//         name: "email",
//         type: "string",
//         required: true,
//         isEmail: true,
//     },
//     {
//         name: "password",
//         type: "string",
//         required: false,
//     },
//     {
//         name: "otp",
//         type: "string",
//         required: true,
//     },
// ];

// const main: RequestHandler = async (req, res) => {
//     const body = new Validator(req, res).process<{
//         email: string;
//         password: string;
//         otp: string;
//     }>(schemaValidation, ValidatorType.BODY);
//     console.log(body);
//     console.log(req.headers["x-forwarded-for"]);

//     const encryptService = new EncryptionService(EncryptJoseType.RESELLER);
//     const userService = new CustomerService();
//     const config = new Config();

//     let user: CustomerEntity = await userService.findResellerWithPasswordBy("email", body.email);

//     if (!user) {
//         throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
//     }

//     if (user.roleId !== config.roleReseller) {
//         throw new BusinessError("Email/Nomor Whatsapp atau password tidak valid", ErrorType.Validation);
//     }

//     const resellerConfigService = new ResellerConfigService();
//     const resellerConfig = await resellerConfigService.findOneBy({
//         column: "resellerId",
//         value: user.id,
//     });

//     if (!resellerConfig) {
//         await resellerConfigService.create({
//             id: uuid(),
//             resellerId: user.id,
//             percentageMargin: 0,
//             apiKey: uuid(),
//             webhookApiKey: uuid(),
//             webhookCallbackUrl: "",
//         });
//     }

//     const otpService = new CustomerOtpService();
//     const otp = await otpService.model.findOne({
//         where: {
//             mobileNumber: user.mobileNumber,
//             type: "login_reseller",
//             category: "reseller",
//         },
//     });

//     if (!otp) {
//         throw new BusinessError("Silahkan coba beberapa saat lagi, dan coba lagi", ErrorType.BadRequest);
//     }

//     const isExpired = dayjs(dayjs(otp.expiredAt)).isBefore(dayjs());
//     if (isExpired) {
//         throw new BusinessError("Otp sudah kadaluarsa", ErrorType.BadRequest);
//     }

//     if (otp.otp !== body.otp) {
//         throw new BusinessError("Otp tidak valid", ErrorType.BadRequest);
//     }

//     const encrypt = await encryptService.encryptData(
//         {
//             ...user.dataValues,
//             password: undefined,
//         },
//         7,
//         "day",
//     );

//     const expiredAtOneYearAgo = dayjs().subtract(1, "year").toDate();
//     await otpService.updateBy({
//         by: "id",
//         value: otp.id,
//         data: {
//             expiredAt: expiredAtOneYearAgo,
//         },
//     });

//     res.cookie("session_gasskeun_reseller", encrypt, {
//         httpOnly: true,
//         maxAge: config.maxAgeLogin * 1000,
//         // domain: config.domainReseller,
//         // path: process.env.NODE_ENV.toLowerCase() === "production" ? "/" : "/reseller",
//         secure: process.env.NODE_ENV.toLowerCase() === "production",
//     });
//     res.clearCookie("session_login_reseller");
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//     res.sendStatus(200);
//     return;
// };

// export const postLoginReseller: IApiRouter = {
//     path,
//     method,
//     main,
//     auth,
// };
