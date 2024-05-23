import { ErrorType, ValidatorType } from "@enum/index";
import { Request, Response } from "express";
import Joi from "joi";
import { IPagination } from "./validator";
import { BusinessError } from "./handleError";

const pagination = Joi.object({
    page: Joi.number().default(1),
    sort: Joi.string().default("createdAt"),
    order: Joi.string().allow("ASC", "DESC").default("DESC"),
    limit: Joi.number().min(1).max(100).default(10),
});

export class ValidatorV2 {
    protected request: Request;
    protected response: Response;

    constructor(req: Request, res: Response) {
        this.request = req;
        this.response = res;
    }

    public process<T>(schema: Joi.ObjectSchema<T> | Joi.ArraySchema<T>, type: ValidatorType, addPagination?: false): T;
    public process<T>(
        schema: Joi.ObjectSchema<T> | Joi.ArraySchema<T>,
        type: ValidatorType,
        addPagination: true,
    ): T & IPagination;
    public process<T>(
        schema: Joi.ObjectSchema<T> | Joi.ArraySchema<T>,
        type: ValidatorType,
        addPagination?: boolean,
    ): T | (T & IPagination) {
        if (addPagination) {
            schema = Joi.object({ ...schema, ...pagination });
        }

        const { error } = schema.validate(this.request[type], { abortEarly: false });
        if (error) {
            const firstError = error.details[0];
            const errorMessage = firstError.message.replace(/\[\d+\]\./g, "").replace(/"/g, "");
            throw new BusinessError(errorMessage, ErrorType.Validation);
        }

        return this.request[type];
    }
}
