import { Request, Response, NextFunction, Router } from "express";
import { authAdmin, authLoginUser, authWehbookInternal, authWehbookXendit } from "../middlewares/sessions";
import responseErrorHandler from "@middleware/responseErrorHandler";
import { IApiRouter } from "src/interfaces";
import { postOrder } from "./POST/postOrder";
import { getBanners } from "./GET/getBanners";
import upload from "@config/multer";
import { createBanner } from "./admin/maintenanceBanner/createBanner";
import { listBannerPagination } from "./admin/maintenanceBanner/listBannerPagination";
import { updateBanner } from "./admin/maintenanceBanner/updateBanner";
import { deleteBanner } from "./admin/maintenanceBanner/deleteBanner";
import { getBannerById } from "./admin/maintenanceBanner/getBannerById";
import { activationPaymentMethod } from "./admin/maintenancePayment/activationPaymentMethod";
import { getGameByCategory } from "./GET/getGameByCategory";
import { postArticle } from "./admin/maintenanceArticle/postArticle";
import { getLastArticels } from "./GET/getArticles";
import { getVideos } from "./GET/getVideos";
import { postRegistration } from "./POST/postRegistration";
import { getUserProfileById } from "./GET/getUserProfileById";
import { postLogin } from "./POST/postLogin";

let router = Router();

const apis = [
    // Maintenance Banner
    createBanner,
    listBannerPagination,
    updateBanner,
    deleteBanner,
    getBannerById,

    // Maintenance Payment Method
    activationPaymentMethod,

    // Maintenance Article
    postArticle,

    // POST
    postOrder,
    postRegistration,
    postLogin,

    // GET
    getBanners,
    getGameByCategory,
    getLastArticels,
    getVideos,
    getUserProfileById,
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
    }

    const main = (req: Request, res: Response, next: NextFunction) =>
        api.main(req, res, next).catch((err: Error) => {
            responseErrorHandler(err, res, req);
        });

    if (isUploadImage) {
        if (auth === "guess") {
            router[method.toLowerCase()](path, upload.single(dataImg.field), main);
        } else {
            router[method.toLowerCase()](path, upload.single(dataImg.field), authorization, main);
        }
    } else {
        if (auth === "guess") {
            router[method.toLowerCase()](path, main);
        } else {
            router[method.toLowerCase()](path, authorization, main);
        }
    }
}

let webhook = Router();

const apisWebhook = [];

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
