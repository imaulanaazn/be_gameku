import { Request, Response, NextFunction, Router } from "express";
import {
  authAdmin,
  authDigiflazzOrder,
  authLoginUser,
  authReseller,
  authWebhookDigiflazz,
  authWebhookLapakgaming,
  authWebhookMidtrans,
  authWebhookTokopay,
  authWehbookAPIGames,
  authWehbookInternal,
  authWehbookXendit,
} from "../middlewares/sessions";
import responseErrorHandler from "@middleware/responseErrorHandler";
import { IApiRouter } from "src/interfaces";
// import { postOrder } from "./POST/postOrder";
import { getBanners } from "./GET/getBanners";
import upload from "@config/multer";
import { createBanner } from "./admin/maintenanceBanner/createBanner";
import { updateBanner } from "./admin/maintenanceBanner/updateBanner";
import { deleteBanner } from "./admin/maintenanceBanner/deleteBanner";
import { getBannerById } from "./admin/maintenanceBanner/getBannerById";
import { putActivationPaymentMethod } from "./admin/maintenancePayment/putActivationPaymentMethod";
import { getGameByCategory } from "./GET/getGameByCategory";
// import { postArticle } from "./admin/maintenanceArticle/postArticle";
// import { getVideos } from "./GET/getVideos";
import { postRegistration } from "./POST/postRegistration";
import { getUserProfile } from "./GET/getUserProfile";
import { postLogin } from "./POST/postLogin";
import { deleteLogout } from "./DELETE/deleteLogout";
import { getProducts } from "./GET/getProducts";
import { getGameDetailById } from "./GET/getGameDetail";
import { getListPaymentsMethod } from "./GET/getListPaymentMethod";
import { getGameCategory } from "./GET/getGameCategory";
import { postCheckPromoCode } from "./POST/postCheckPromoCode";
// import { webhookQris } from "./webhook/xendit/qris.callback";
import { getOrderHistory } from "./GET/getOrderHistory";
// import { getOrderDetail } from "./GET/getOrderDetail";
// import { webhookEwallet } from "./webhook/xendit/ewallet.callback";
// import { webhookRetail } from "./webhook/xendit/retail.callback";
// import { webhookVirtualAccount } from "./webhook/xendit/va.callback";
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
// import { sendWhatsappTest } from "./admin/sendWhatsappTest";
// import { getAllTemplateWhatsapp } from "./admin/maintenanceConfiguration/getAllTemplateWhatsapp";
import { getSocialMedia } from "./GET/getSocialMedia";
import { getAllSocialMediaPagination } from "./admin/maintenanceSocialMedia/getAllSocialMediaPagination";
import { loginAdmin } from "./admin/loginAdmin";
import { createAdmin } from "./admin/maintenanceAdmin/createAdmin";
import { getAllAdminPagination } from "./admin/maintenanceAdmin/getAllAdminPagination";
import { deleteAdmin } from "./admin/maintenanceAdmin/deleteAdmin";
import { putXenditConfig } from "./admin/maintenanceConfiguration/putXenditConfig";
// import { putTemplateWhatsapp } from "./admin/maintenanceConfiguration/putTemplateMessage";
// import { getAllYoutubeVideoPagination } from "./admin/maintenanceYoutubeVideo/getAllYoutubeVideoWithPagination";
import { getAllVoucherGamePagination } from "./admin/maintenanceVoucherGame/getAllVoucherGamePagination";
import { getOrderAnalytics } from "./admin/getOrderAnalytics";
import { getMeAdmin } from "./admin/getMe";
import { getConfig } from "./GET/getConfig";
import { putConfig } from "./admin/maintenanceConfiguration/putConfig";
import { deleteLogoutAdmin } from "./admin/logoutAdmin";
// import { createYoutubeVideo } from "./admin/maintenanceYoutubeVideo/createYoutubeVideo";
// import { putYoutubeVideo } from "./admin/maintenanceYoutubeVideo/putYoutubeVideo";
// import { deleteYoutubeVideo } from "./admin/maintenanceYoutubeVideo/deleteYoutubeVideo";
import { createSocialMedia } from "./admin/maintenanceSocialMedia/createSocialMedia";
import { deleteSocialMedia } from "./admin/maintenanceSocialMedia/deleteSocialMedia";
import { putSocialMedia } from "./admin/maintenanceSocialMedia/putSocialMedia";
import { getAllDenomOnlyAttr } from "./admin/maintenanceProduct/getAllDenomOnlyAttr";
import { createVoucherGame } from "./admin/maintenanceVoucherGame/createVoucherGame";
// import { getOtp } from "./GET/getOtp";
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
// import { webhookApiGames } from "./webhook/apigames";
import { cronjobSetExpiredPayment } from "./cronjob/setExpiredPayment";
import { putArchiveProduct } from "./admin/maintenanceProduct/putChangeStatusProduct";
// import { postLoginReseller } from "./reseller/POST/postLoginReseller";
// import { postRegisterReseller } from "./reseller/POST/postRegisterReseller";
// import { getDenomReseller } from "./reseller/GET/getDenomReseller";
// import { postTopupFund } from "./reseller/POST/postTopupFund";
// import { getMeReseller } from "./reseller/GET/getMeReseller";
// import { postOrderReseller } from "./reseller/POST/postOrderReseller";
// import { postCheckPromoCodeReseller } from "./reseller/POST/postCheckPromotionReseller";
// import { getAllOrdersPaginationReseller } from "./reseller/GET/getOrderHistory";
// import { postRequestOtp } from "./reseller/POST/postRequestOtp";
// import { getBalance } from "./reseller/GET/getBalance";
// import { getStatistic } from "./reseller/GET/getStatistic";
// import { getChartOverview } from "./reseller/GET/getChartOverview";
// import { getSalesOverview } from "./reseller/GET/getSalesOverview";
// import { getOrderDetailResellerV2 } from "./reseller/GET/getOrderByInvoiceIdV2";
// import { getChangePasswordOtp } from "./reseller/GET/getOtpReseller";
// import { putChangePassword } from "./reseller/PUT/putChangePassword";
// import { putProfileImage } from "./reseller/PUT/putProfileImage";
// import { putReseller } from "./reseller/PUT/putProfile";
// import { deleteLogoutReseller } from "./reseller/DELETE/logout";
// import { getDenomResellerByCategory } from "./reseller/GET/getDenomByCategory";
// import { syncDigiflazzData } from "./cronjob/syncDigiflazzData";
import { processVoucherInternal } from "./webhook/internal/processVoucherInternal";
import { getAllProviders } from "./GET/getProviders";
// import { webhookDigiflazz } from "./webhook/digiflazz";
// import { webhookLapakGaming } from "./webhook/lapakgaming";
// import { syncTokoVoucherData } from "./cronjob/syncTokovoucherData";
import { processSuccessOrder } from "./webhook/internal/processSuccessOrder";
// import { webhookLapakGamingUpdateProduct } from "./webhook/lapakgaming/updateProduct";
import { createProductCategory } from "./admin/maintenanceProductCategory/create";
import { getAllProductCategoryPagination } from "./admin/maintenanceProductCategory/getAllPagination";
import { putProductCategory } from "./admin/maintenanceProductCategory/putProductCategory";
import { deleteProductCategory } from "./admin/maintenanceProductCategory/delete";
import { syncMiraclegamingDataDesc } from "./cronjob/syncDescProduct";
import { putProductPrices } from "./admin/maintenanceConfiguration/syncPrices";
import { getSyncSpreadsheets } from "./GET/getSyncSpreadsheet";
// import { getOrderDetailReseller } from "./reseller/GET/getOrderByInvoiceId";
import { getAllDepositPagination } from "./admin/maintenanceDeposit/getAllDepositPagination";
import { approvalDeposit } from "./admin/maintenanceDeposit/approvalDeposit";
// import { putChangeResellerConfig } from "./reseller/PUT/putChangeResellerConfig";
// import { getResellerConfig } from "./reseller/GET/getResellerConfig";
import { postResendOrderFailed } from "./admin/maintenanceOrders/postResendOrderFailed";
import { postCreateOrderReview } from "./POST/postCreateOrderReview";
import { putChangeOrderReview } from "./PUT/putChangeOrderReview";
import { getListOrderReviews } from "./GET/getListOrderReviews";
import { cronSetOrderReview } from "./cronjob/cronSetOrderReview";
import { getDownloadExcelOrder } from "./admin/report/getDownloadExcelOrder";
import { getOrderAnalyticsV2 } from "./admin/getOrderAnalyticsV2";
import { getLatestOrder } from "./admin/getLatestOrder";
import { getRevenue } from "./admin/getRevenue";
// import { syncLapakgamingDataV2 } from "./cronjob/syncLapakgamingDataV2";
// import { checkingTokoKuponOrderStatus } from "./cronjob/checkingTokoKuponOrderStatus";
import { syncTokoKuponData } from "./cronjob/syncTokoKuponData";
// import { sendNotifyBalanceReseller } from "./admin/maintenanceUser/sendNotifyBalanceReseller";
import { putPopularBulkV2 } from "./admin/maintenanceGame/putPopularBulkV2";
// import { postOrderV2 } from "./POST/postOrderV2";
import { getOrderDetailV2 } from "./GET/getOrderDetailV2";
import { webhookTokopay } from "./webhook/tokopay";
import { APIAuth } from "@enum/index";
import { getListRoles } from "./admin/maintenanceRole/getListRole";
import { putAssignRole } from "./admin/maintenanceRole/putAssignRole";
import { getListAdminMenu } from "./admin/maintenanceAdminMenu/getListAdminMenu";
// import { postArticle } from "./admin/maintenanceArticle/postArticle";
// import { getListArticle } from "./admin/maintenanceArticle/getListArticle";
// import { getArticleDetail } from "./admin/maintenanceArticle/getArticleDetail";
// import { deleteArticle } from "./admin/maintenanceArticle/deleteArticle";
import { getImage } from "./GET/getImage";
// import { updateArticle } from "./admin/maintenanceArticle/updateArticle";
// import { updateStatusArticle } from "./admin/maintenanceArticle/updateStatusArticle";
// import { getArticleBySlug } from "./GET/getArticleBySlug";
// import { getListArticles } from "./GET/getListArticles";
// import { sendMessagePendingOrder } from "./cronjob/sendMessagePendingOrder";
import { postUploadImage } from "./admin/maintenanceImage/postUploadImage";
import { deleteImage } from "./admin/maintenanceImage/deleteImage";
// import { postArticleComment } from "./POST/postArticleComment";
// import { getArticleComments } from "./GET/getArticleComments";
// import { createArticleCategory } from "./admin/maintenanceArticleCategory/createArticleCategory";
// import { updateArticleCategory } from "./admin/maintenanceArticleCategory/updateArticleCategory";
// import { deleteArticleCategory } from "./admin/maintenanceArticleCategory/deleteArticleCategory";
// import { getArticleCategoryById } from "./admin/maintenanceArticleCategory/getArticleCategoryById";
// import { getListArticleCategory } from "./admin/maintenanceArticleCategory/getListArticleCategory";
import { putPaymentGuide } from "./admin/maintenancePayment/putPaymentGuide";
import { getOrderHistoryUser } from "./GET/getOrderHistoryUser";
import { postTopupFundUser } from "./POST/postTopupFundUser";
import { postOrderV3 } from "./POST/postOrderV3";
import { getUserBalance } from "./GET/getUserBalance";
// import { postOrderDigiflazzSeller } from "./webhook/digiflazz/sellerDigiflazz";
import { dropdownProductCategoryPagination } from "./admin/maintenanceProductCategory/getDropdownProductCategory";
import { dropdownGameCategory } from "./admin/maintenanceGameCategory/dropdownGameCategory";
import { webhookMidtrans } from "./webhook/midtrans";
import { syncMiracleGamingData } from "./cronjob/syncMiracleGamingData";
import { webhookManual } from "./webhook/manual";
// import { getWhatsappStatus } from "./admin/maintenanceConfiguration/getWhatsappStatus";

let router = Router();

const apis = [
  getSyncSpreadsheets,

  loginAdmin,
  deleteLogoutAdmin,
  getOrderAnalytics,
  getOrderAnalyticsV2,
  getLatestOrder,
  getMeAdmin,
  getRevenue,

  putConfig,
  putProductPrices,

  // Report
  getDownloadExcelOrder,

  // Maintenance Payment Method
  putPaymentGuide,

  // Maintenance Deposit
  getAllDepositPagination,
  approvalDeposit,

  // Maintenance Order
  getAllOrdersPagination,
  postResendOrderFailed,
  putStatusOrder,

  // Maintenance Game Voucher
  getAllVoucherGamePagination,
  createVoucherGame,
  putVoucherGame,
  deleteVoucherGame,

  // Maintenance Youtube Video
  //   getAllYoutubeVideoPagination,
  //   createYoutubeVideo,
  //   putYoutubeVideo,
  //   deleteYoutubeVideo,

  // Maintenance Admin
  createAdmin,
  getAllAdminPagination,
  deleteAdmin,

  // getWhatsappStatus,
  //   sendWhatsappTest,
  //   getAllTemplateWhatsapp,
  //   putTemplateWhatsapp,

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
  //   sendNotifyBalanceReseller,

  // Maintenance Game
  createGame,
  putGame,
  getAllGameOnlyName,
  getAllGamePagination,
  putPopularBulk,
  putPopularBulkV2,
  deleteGame,
  dropdownGameCategory,

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
  // getListArticle,
  // getArticleDetail,
  // deleteArticle,
  // updateArticle,
  // updateStatusArticle,

  // Maintenance Sosmed
  getAllSocialMediaPagination,
  createSocialMedia,
  deleteSocialMedia,
  putSocialMedia,

  // Maintenace Product Category
  createProductCategory,
  getAllProductCategoryPagination,
  putProductCategory,
  deleteProductCategory,
  dropdownProductCategoryPagination,

  // Maintenance Role
  getListRoles,
  putAssignRole,

  // Maintenance Menu
  getListAdminMenu,

  // Maintenance Image
  postUploadImage,
  deleteImage,

  // Maintenance Article Category
  // createArticleCategory,
  // updateArticleCategory,
  // deleteArticleCategory,
  // getArticleCategoryById,
  // getListArticleCategory,

  // POST
  //   postOrder,
  //   postOrderV2,
  postRegistration,
  postLogin,
  postCheckPromoCode,
  postCreateOrderReview,
  // postArticleComment,
  postTopupFundUser,
  postOrderV3,

  // GET
  getBanners,
  getGameByCategory,
  //   getVideos,
  getUserProfile,
  getProducts,
  getGameDetailById,
  getListPaymentsMethod,
  getGameCategory,
  getOrderHistory,
  //   getOrderDetail,
  getOrderDetailV2,
  getSocialMedia,
  getConfig,
  //   getOtp,
  getMetaByPath,
  getAllProviders,
  getListOrderReviews,
  getImage,
  //   getArticleBySlug,
  // getListArticles,
  // getArticleComments,
  getOrderHistoryUser,
  getUserBalance,
  getOrderHistoryUser,

  // DELETE
  deleteLogout,

  // PUT
  putCustomer,
  putCustomerImage,
  putChangeOrderReview,

  // CRONJOB
  cronjobSetExpiredPayment,
  //   syncDigiflazzData,
  //   syncLapakgamingData,
  //   syncLapakgamingDataV2,
  syncMiracleGamingData,
  syncMiraclegamingDataDesc,
  cronSetOrderReview,
  //   checkingTokoKuponOrderStatus,
  syncTokoKuponData,
  //   sendMessagePendingOrder,

  /**
   * Start for reseller API
   */

  // POST
  //   postLoginReseller,
  //   postRegisterReseller,
  //   postTopupFund,
  //   postOrderReseller,
  //   postCheckPromoCodeReseller,
  //   postRequestOtp,

  // GET
  //   getDenomReseller,
  //   getMeReseller,
  //   getAllOrdersPaginationReseller,
  //   getBalance,
  //   getStatistic,
  //   getChartOverview,
  //   getSalesOverview,
  //   getOrderDetailReseller,
  //   getOrderDetailResellerV2,
  //   getChangePasswordOtp,
  //   getDenomResellerByCategory,
  //   getResellerConfig,

  // PUT
  //   putChangePassword,
  //   putProfileImage,
  //   putReseller,
  //   putChangeResellerConfig,

  // DELETE
  //   deleteLogoutReseller,
];

for (const api of apis) {
  let { path, method, auth, isUploadImage, dataImg } = api as IApiRouter;
  if (!path.startsWith("/api")) {
    path = "/api" + path;
  }

  const authAdmins = [
    APIAuth.ADMIN,
    APIAuth.OWNER,
    APIAuth.WRITER,
    APIAuth.ALL_ADMIN,
  ];

  let authorization;
  if (authAdmins.includes(auth)) {
    const a = (req: Request, res: Response, next: NextFunction) => {
      authAdmin(req, res, next)(auth);
    };
    authorization = a;
  } else if (auth === APIAuth.USER) {
    authorization = authLoginUser;
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
    const uploadMiddleware = dataImg.single
      ? upload.single(dataImg.field)
      : upload.fields(fieldImages);

    if (auth !== APIAuth.GUEST) {
      router[method.toLowerCase()](path, authorization, uploadMiddleware, main);
    } else {
      router[method.toLowerCase()](path, uploadMiddleware, main);
    }
  } else {
    if (auth !== APIAuth.GUEST) {
      router[method.toLowerCase()](path, authorization, main);
    } else {
      router[method.toLowerCase()](path, main);
    }
  }
}

let webhook = Router();

const apisWebhook = [
  // XENDIT
  // webhookQris,
  // webhookEwallet,
  // webhookRetail,
  // webhookVirtualAccount,

  // API GAMES
  // webhookApiGames,

  // INTERNAL
  processVoucherInternal,
  processSuccessOrder,

  // DIGIFLAZZ
  // webhookDigiflazz,
  // postOrderDigiflazzSeller,

  // LAPAKGAMING
  // webhookLapakGaming,
  // webhookLapakGamingUpdateProduct,

  // TOKOPAY
  webhookTokopay,

  // MIDTRANS
  webhookMidtrans,

  // MANUAL
  webhookManual,
];

for (const api of apisWebhook) {
  let { path, method, auth, middlewares } = api as IApiRouter;
  if (!path.startsWith("/api")) {
    path = "/api" + path;
  }

  middlewares = middlewares || [];

  let authorization;
  if (auth === APIAuth.WEBHOOK_INTERNAL || auth === APIAuth.WEBHOOK_MANUAL) {
    //@ts-ignore
    const xApiKey = api.xApiKey;
    const authInternal = (req: Request, res: Response, next: NextFunction) => {
      authWehbookInternal(req, res, next)(xApiKey);
    };
    authorization = authInternal;
  } else if (auth === APIAuth.WEBHOOK_XENDIT) {
    authorization = authWehbookXendit;
  } else if (auth === APIAuth.WEBHOOK_APIGAMES) {
    authorization = authWehbookAPIGames;
  } else if (auth === APIAuth.WEBHOOK_DIGIFLAZZ) {
    authorization = authWebhookDigiflazz;
  } else if (auth === APIAuth.WEBHOOK_LAPAKGAMING) {
    authorization = authWebhookLapakgaming;
  } else if (auth === APIAuth.DIGIFLAZZ_SELLER) {
    authorization = authDigiflazzOrder;
  } else if (auth === APIAuth.WEBHOOK_TOKOPAY) {
    authorization = authWebhookTokopay;
  } else if (auth === APIAuth.WEBHOOK_MIDTRANS) {
    authorization = authWebhookMidtrans;
  }

  const main = (req: Request, res: Response, next: NextFunction) =>
    api.main(req, res, next).catch((err: Error) => {
      responseErrorHandler(err, res, req);
    });

  if (auth === APIAuth.GUEST) {
    webhook[method.toLowerCase()](path, ...middlewares, main);
  } else {
    if (authorization) {
      webhook[method.toLowerCase()](path, ...middlewares, authorization, main);
    } else {
      webhook[method.toLowerCase()](path, ...middlewares, main);
    }
  }
}

export { webhook, router };
