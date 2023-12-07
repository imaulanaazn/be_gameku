import { Request, Response, NextFunction, Router } from "express";
import {
    authAdmin,
    authLoginUser,
    authSuperAdmin,
    authWehbookAPIGames,
    authWehbookInternal,
    authWehbookXendit,
} from "../middlewares/sessions";
import responseErrorHandler from "@middleware/responseErrorHandler";
import { IApiRouter } from "src/interfaces";
import { postOrder } from "./POST/postOrder";
import { getBanners } from "./GET/getBanners";
import upload from "@config/multer";
import { createBanner } from "./admin/maintenanceBanner/createBanner";
import { updateBanner } from "./admin/maintenanceBanner/updateBanner";
import { deleteBanner } from "./admin/maintenanceBanner/deleteBanner";
import { getBannerById } from "./admin/maintenanceBanner/getBannerById";
import { putActivationPaymentMethod } from "./admin/maintenancePayment/putActivationPaymentMethod";
import { getGameByCategory } from "./GET/getGameByCategory";
// import { postArticle } from "./admin/maintenanceArticle/postArticle";
import { getLastArticels } from "./GET/getArticles";
import { getVideos } from "./GET/getVideos";
import { postRegistration } from "./POST/postRegistration";
import { getUserProfile } from "./GET/getUserProfile";
import { postLogin } from "./POST/postLogin";
import { deleteLogout } from "./DELETE/deleteLogout";
import { getProducts } from "./GET/getProducts";
import { getGameDetailById } from "./GET/getGameDetail";
import { getListPaymentsMethod } from "./GET/getListPaymentMethod";
import { getGameCategory } from "./GET/getGameCategory";
import { postCheckPromoCode } from "./POST/postCheckPromoCode";
import { webhookQris } from "./webhook/xendit/qris.callback";
import { getOrderHistory } from "./GET/getOrderHistory";
import { getOrderDetail } from "./GET/getOrderDetail";
import { webhookEwallet } from "./webhook/xendit/ewallet.callback";
import { webhookRetail } from "./webhook/xendit/retail.callback";
import { webhookVirtualAccount } from "./webhook/xendit/va.callback";
import { getAllUserPagination } from "./admin/maintenanceUser/getAllUserPagination";
import { getAllGamePagination } from "./admin/maintenanceGame/getAllGamePagination";
import { putPopularBulk } from "./admin/maintenanceGame/putPopularBulk";
import { deleteGame } from "./admin/maintenanceGame/deleteGame";
import { getAllDenomPagination } from "./admin/maintenanceProduct/getAllDenomPagination";
import { getAllPaymentMethodPagination } from "./admin/maintenancePayment/getAllPaymentMethodPagination";
import { getAllPromoCodePagination } from "./admin/maintenancePromoCode/getAllPromoCodePagination";
import { getAllBannerPagination } from "./admin/maintenanceBanner/getAllGamePagination";
import { deletePromotion } from "./admin/maintenancePromoCode/deletePromotion";
import { createPromotion } from "./admin/maintenancePromoCode/createPromotion";
import { getAllGameOnlyName } from "./admin/maintenanceGame/getAllGameOnlyName";
import { sendWhatsappTest } from "./admin/sendWhatsappTest";
import { getAllTemplateWhatsapp } from "./admin/maintenanceConfiguration/getAllTemplateWhatsapp";
import { getSocialMedia } from "./GET/getSocialMedia";
import { getAllSocialMediaPagination } from "./admin/maintenanceSocialMedia/getAllSocialMediaPagination";
import { loginAdmin } from "./admin/loginAdmin";
import { createAdmin } from "./admin/maintenanceAdmin/createAdmin";
import { getAllAdminPagination } from "./admin/maintenanceAdmin/getAllAdminPagination";
import { deleteAdmin } from "./admin/maintenanceAdmin/deleteAdmin";
import { putXenditConfig } from "./admin/maintenanceConfiguration/putXenditConfig";
import { putTemplateWhatsapp } from "./admin/maintenanceConfiguration/putTemplateMessage";
import { getAllYoutubeVideoPagination } from "./admin/maintenanceYoutubeVideo/getAllYoutubeVideoWithPagination";
import { getAllVoucherGamePagination } from "./admin/maintenanceVoucherGame/getAllVoucherGamePagination";
import { getOrderAnalytics } from "./admin/getOrderAnalytics";
import { getMeAdmin } from "./admin/getMe";
import { getConfig } from "./GET/getConfig";
import { putConfig } from "./admin/maintenanceConfiguration/putConfig";
import { deleteLogoutAdmin } from "./admin/logoutAdmin";
import { createYoutubeVideo } from "./admin/maintenanceYoutubeVideo/createYoutubeVideo";
import { putYoutubeVideo } from "./admin/maintenanceYoutubeVideo/putYoutubeVideo";
import { deleteYoutubeVideo } from "./admin/maintenanceYoutubeVideo/deleteYoutubeVideo";
import { createSocialMedia } from "./admin/maintenanceSocialMedia/createSocialMedia";
import { deleteSocialMedia } from "./admin/maintenanceSocialMedia/deleteSocialMedia";
import { putSocialMedia } from "./admin/maintenanceSocialMedia/putSocialMedia";
import { getAllDenomOnlyAttr } from "./admin/maintenanceProduct/getAllDenomOnlyAttr";
import { createVoucherGame } from "./admin/maintenanceVoucherGame/createVoucherGame";
import { getOtp } from "./GET/getOtp";
import { getAllOrdersPagination } from "./admin/maintenanceOrders/getAllOrdersPagination";
import { putCustomer } from "./PUT/putCustomer";
import { putStatusOrder } from "./admin/maintenanceOrders/putStatusOrder";
import { createGame } from "./admin/maintenanceGame/createGame";
import { putGame } from "./admin/maintenanceGame/putGame";
import { deleteProduct } from "./admin/maintenanceProduct/deleteDenom";
import { createDenom } from "./admin/maintenanceProduct/createDenom";
import { putDenom } from "./admin/maintenanceProduct/putDenom";
import { getMetaByPath } from "./GET/getMeta";
import { putVoucherGame } from "./admin/maintenanceVoucherGame/putGameVoucher";
import { deleteVoucherGame } from "./admin/maintenanceVoucherGame/deleteVoucherGame";
import { putPromotion } from "./admin/maintenancePromoCode/putPromotion";
import { putCustomerImage } from "./PUT/putUploadImage";
import { webhookApiGames } from "./webhook/apigames";
import { cronjobSetExpiredPayment } from "./cronjob/setExpiredPayment";
import { putArchiveProduct } from "./admin/maintenanceProduct/putChangeStatusProduct";
// import { getWhatsappStatus } from "./admin/maintenanceConfiguration/getWhatsappStatus";

let router = Router();

const apis = [
    loginAdmin,
    deleteLogoutAdmin,
    getOrderAnalytics,
    getMeAdmin,

    putConfig,

    // Maintenance Order
    getAllOrdersPagination,
    putStatusOrder,

    // Maintenance Game Voucher
    getAllVoucherGamePagination,
    createVoucherGame,
    putVoucherGame,
    deleteVoucherGame,

    // Maintenance Youtube Video
    getAllYoutubeVideoPagination,
    createYoutubeVideo,
    putYoutubeVideo,
    deleteYoutubeVideo,

    // Maintenance Admin
    createAdmin,
    getAllAdminPagination,
    deleteAdmin,

    // getWhatsappStatus,
    sendWhatsappTest,
    getAllTemplateWhatsapp,
    putTemplateWhatsapp,

    // Xendit
    putXenditConfig,

    // Maintenance PromoCode
    createPromotion,
    getAllPromoCodePagination,
    deletePromotion,
    putPromotion,

    // Maintenance Product
    createDenom,
    putDenom,
    getAllDenomPagination,
    getAllDenomOnlyAttr,
    deleteProduct,
    putArchiveProduct,

    // Maintenance User
    getAllUserPagination,

    // Maintenance Game
    createGame,
    putGame,
    getAllGameOnlyName,
    getAllGamePagination,
    putPopularBulk,
    deleteGame,

    // Maintenance Banner
    getAllBannerPagination,
    createBanner,
    updateBanner,
    deleteBanner,
    getBannerById,

    // Maintenance Payment Method
    putActivationPaymentMethod,
    getAllPaymentMethodPagination,

    // Maintenance Article
    // postArticle,

    // Maintenance Sosmed
    getAllSocialMediaPagination,
    createSocialMedia,
    deleteSocialMedia,
    putSocialMedia,

    // POST
    postOrder,
    postRegistration,
    postLogin,
    postCheckPromoCode,

    // GET
    getBanners,
    getGameByCategory,
    getLastArticels,
    getVideos,
    getUserProfile,
    getProducts,
    getGameDetailById,
    getListPaymentsMethod,
    getGameCategory,
    getOrderHistory,
    getOrderDetail,
    getSocialMedia,
    getConfig,
    getOtp,
    getMetaByPath,

    // DELETE
    deleteLogout,

    // PUT
    putCustomer,
    putCustomerImage,

    // CRONJOB
    cronjobSetExpiredPayment,
];

for (const api of apis) {
    let { path, method, auth, isUploadImage, dataImg } = api as IApiRouter;
    if (!path.startsWith("/api")) {
        path = "/api" + path;
    }

    let authorization;
    if (auth === "user") {
        authorization = authLoginUser;
    } else if (auth === "admin") {
        authorization = authAdmin;
    } else if (auth === "super-admin") {
        authorization = authSuperAdmin;
    }

    const main = (req: Request, res: Response) =>
        api.main(req, res).catch((err: Error) => {
            responseErrorHandler(err, res, req);
        });

    if (isUploadImage) {
        let fieldImages: any = [];
        if (!dataImg.single) {
            for (const field of dataImg.field) {
                fieldImages.push({
                    name: field,
                });
            }
        }
        const uploadMiddleware = dataImg.single ? upload.single(dataImg.field) : upload.fields(fieldImages);

        if (auth !== "guess") {
            router[method.toLowerCase()](path, authorization, uploadMiddleware, main);
        } else {
            router[method.toLowerCase()](path, uploadMiddleware, main);
        }
    } else {
        if (auth !== "guess") {
            router[method.toLowerCase()](path, authorization, main);
        } else {
            router[method.toLowerCase()](path, main);
        }
    }
}

let webhook = Router();

const apisWebhook = [
    // XENDIT
    webhookQris,
    webhookEwallet,
    webhookRetail,
    webhookVirtualAccount,

    // API GAMES
    webhookApiGames,
];

for (const api of apisWebhook) {
    let { path, method, auth } = api as IApiRouter;
    if (!path.startsWith("/api")) {
        path = "/api" + path;
    }

    let authorization;
    if (auth === "webhook-internal") {
        authorization = authWehbookInternal;
    } else if (auth === "webhook-xendit") {
        authorization = authWehbookXendit;
    } else if (auth === "webhook-apigames") {
        authorization = authWehbookAPIGames;
    }

    const main = (req: Request, res: Response, next: NextFunction) =>
        api.main(req, res, next).catch((err: Error) => {
            responseErrorHandler(err, res, req);
        });

    if (auth === "guess") {
        webhook[method.toLowerCase()](path, main);
    } else {
        webhook[method.toLowerCase()](path, authorization, main);
    }
}

export { webhook, router };
