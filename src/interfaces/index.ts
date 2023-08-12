import { NextFunction, Request, Response } from "express";

export interface IApiRouter {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    auth: "guess" | "user" | "admin" | "cookie" | "webhook-internal" | "webhook-xendit";
    isUploadImage?: boolean;
    dataImg?: {
        field: string;
    };
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
}
