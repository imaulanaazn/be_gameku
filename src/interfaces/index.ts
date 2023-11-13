import { NextFunction, Request, Response } from "express";

type SingleImageData = {
    field: string;
    single: true;
};

type MultipleImageData = {
    field: Array<string>;
    single: false;
};

export type IApiRouter = IApiRouterWithImage | IApiRouterWithoutImage;

export interface IApiRouterWithImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    auth: "guess" | "user" | "admin" | "cookie" | "webhook-internal" | "webhook-xendit" | "super-admin";
    isUploadImage?: true;
    dataImg: SingleImageData | MultipleImageData;
}
export interface IApiRouterWithoutImage {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    auth: "guess" | "user" | "admin" | "cookie" | "webhook-internal" | "webhook-xendit" | "super-admin";
    isUploadImage?: false;
    dataImg?: SingleImageData | MultipleImageData;
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

interface ReqWithWhatsappService extends Request {
    whatsappService;
}
