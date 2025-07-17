// import { IApiRouter } from "@interfaces/index";
// import { RequestHandler } from "express";
// import { APIAuth, APIMethod } from "@enum/index";

// const path = "/v1/reseller/logout";
// const method = APIMethod.DELETE;
// const auth = APIAuth.RESELLER;

// const main: RequestHandler = async (req, res) => {
//     const reseller = req.reseller.data;
//     res.clearCookie("session_gasskeun_reseller");
//     return res.sendStatus(200);
// };

// export const deleteLogoutReseller: IApiRouter = {
//     main,
//     path,
//     method,
//     auth,
// };
