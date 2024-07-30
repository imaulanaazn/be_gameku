import { Config } from "@config/index";
import { APIAuth, APIMethod } from "@enum/index";
import { MinioService } from "@serviceExternal/minio.service";
import { RedisService } from "@serviceExternal/redis.service";
import { AdminService } from "@serviceInternal/admin.service";
import { AdminRoleService } from "@serviceInternal/adminRole.service";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { ArticleService } from "@serviceInternal/article.service";
import { ArticleButtonService } from "@serviceInternal/articleButton.service";
import { ArticleCategoryService } from "@serviceInternal/articleCategory.service";
import { ArticleCategoryArticleService } from "@serviceInternal/articleCategoryArticle.service";
import { ArticleImageService } from "@serviceInternal/articleImage.service";
import { ArticleCommentService } from "@serviceInternal/articleComment.service";
import { NextFunction, Request, Response, RequestHandler } from "express";

type SingleImageData = {
    field: string;
    single: true;
};

type MultipleImageData = {
    field: Array<string>;
    single: false;
};

export type IApiRouter =
    | IApiRouterWebhookInternalWithImage
    | IApiRouterWebhookInternalWithoutImage
    | IApiRouterWithImage
    | IApiRouterWithoutImage;

export interface IApiRouterWithImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: APIMethod;
    path: string;
    auth: Exclude<APIAuth, APIAuth.WEBHOOK_INTERNAL>;
    isUploadImage?: true;
    dataImg: SingleImageData | MultipleImageData;
    middlewares?: RequestHandler[];
}
export interface IApiRouterWithoutImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: APIMethod;
    path: string;
    auth: Exclude<APIAuth, APIAuth.WEBHOOK_INTERNAL>;
    isUploadImage?: false;
    dataImg?: SingleImageData | MultipleImageData;
    middlewares?: RequestHandler[];
}

interface IApiRouterWebhookInternalWithImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: APIMethod;
    path: string;
    auth: APIAuth.WEBHOOK_INTERNAL;
    xApiKey: string;
    isUploadImage?: true;
    dataImg: SingleImageData | MultipleImageData;
    middlewares?: RequestHandler[];
}
interface IApiRouterWebhookInternalWithoutImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: APIMethod;
    path: string;
    auth: APIAuth.WEBHOOK_INTERNAL;
    xApiKey: string;
    isUploadImage?: false;
    dataImg?: SingleImageData | MultipleImageData;
    middlewares?: RequestHandler[];
}

export interface Validation {
    name: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type: "string" | "number" | "boolean" | "array" | "object" | "any";
    isMobileNo?: boolean;
    isEmail?: boolean;
    default?: any;
    minNumber?: number;
    maxNumber?: number;
    items?: Validation;
    properties?: Array<Validation>;
    enum?: Array<string | number | boolean>;
    errorMessage?: string;
}

export interface IDI {
    config: Config;
    adminService: AdminService;
    adminUserRoleService: AdminUserRoleService;
    adminRoleService: AdminRoleService;
    minioService: MinioService;
    redisService: RedisService;
    articleService: ArticleService;
    articleCategoryService: ArticleCategoryService;
    articleCategoryArticleService: ArticleCategoryArticleService;
    articleButtonService: ArticleButtonService;
    articleImageService: ArticleImageService;
    articleCommentService: ArticleCommentService;
}
