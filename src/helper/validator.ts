import { Request, Response } from "express";
import validator from "validator";
import { ErrorType, ValidatorType } from "@enum/index";
import { BusinessError } from "./handleError";
import { Validation } from "@interfaces/index";

const paginationSchema: Validation[] = [
    {
        name: "page",
        type: "number",
        required: false,
        default: "1",
    },
    {
        name: "sort",
        type: "string",
        required: false,
        default: "createdAt",
    },
    {
        name: "order",
        type: "string",
        required: false,
        enum: ["asc", "desc"],
        default: "asc",
    },
    {
        name: "limit",
        type: "number",
        required: false,
        minNumber: 1,
        maxNumber: 100,
        default: "10",
    },
];

export interface IPagination {
    page: number;
    sort: "asc" | "desc";
    order: string;
    limit: number;
}

export class Validator {
    protected request: Request;
    protected response: Response;

    constructor(req: Request, res: Response) {
        this.request = req;
        this.response = res;
    }

    public process<T>(schema: Validation[], type: ValidatorType, addPagination?: false): T;
    public process<T>(schema: Validation[], type: ValidatorType, addPagination: true): T & IPagination;
    public process<T>(schema: Validation[], type: ValidatorType, addPagination?: boolean): T | (T & IPagination) {
        if (addPagination) {
            schema = [...schema, ...paginationSchema];
        }

        const result = this.checking(schema, type);
        if (!result.success) {
            throw new BusinessError(result.message, ErrorType.Validation);
        } else {
            return {
                ...this.request[type],
            };
        }
    }

    private validationValue(schema: Validation, value: any) {
        const result: {
            success: boolean;
            message: string;
        } = { success: false, message: "" };
        if (schema.type === "boolean" || schema.type === "string" || schema.type === "number") {
            if (schema.enum && !schema.enum.includes(value)) {
                let str;
                if (schema.enum.length === 2) {
                    str = schema.enum.join(" & ");
                } else if (schema.enum.length > 2) {
                    const lastElement = schema.enum.pop();
                    str = schema.enum.join(", ") + " & " + lastElement;
                } else {
                    str = schema.enum.join("");
                }

                result.message = `${schema.name} harus berisi antara ${str}`;
                return result;
            }
        }

        switch (schema.type) {
            case "string":
                if (typeof value !== "string") {
                    result.message = `${schema.name} harus berupa string`;
                    return result;
                }

                if (schema.isEmail) {
                    const email = validator.isEmail(value);
                    if (!email) {
                        result.message = `Email tidak valid`;
                        return result;
                    }
                }

                if (schema.minLength && value.length < schema.minLength) {
                    result.message = `${schema.name} harus memiliki setidaknya ${schema.minLength} karakter`;
                    return result;
                }

                if (schema.maxLength && value.length > schema.maxLength) {
                    result.message = `${schema.name} harus memiliki maksimal ${schema.maxLength} karakter`;
                    return result;
                }

                if (schema.isMobileNo) {
                    let mobileNo = value.toString();
                    const convertedNumber = mobileNo.replace(/^(\+62|62|0)?(\d+)/, "0$2");
                    const check = validator.isMobilePhone(convertedNumber, "id-ID");
                    if (!check) {
                        result.message = `Nomor handphone tidak valid`;
                        return result;
                    }
                }
                break;

            case "number":
                if (typeof value !== "number") {
                    result.message = `${schema.name} harus berupa angka`;
                    return result;
                }

                if (schema.isMobileNo) {
                    let mobileNo = value.toString();
                    const convertedNumber = mobileNo.replace(/^(\+62|62|0)?(\d+)/, "0$2");
                    const check = validator.isMobilePhone(convertedNumber, "id-ID");

                    if (!check) {
                        result.message = `Nomor handphone tidak valid`;
                        return result;
                    }
                }

                if (!schema.minNumber && value < schema.minNumber) {
                    result.message = `${schema.name} harus minimal ${schema.minNumber}`;
                    return result;
                }

                if (!schema.minNumber && value > schema.maxNumber) {
                    result.message = `${schema.name} harus maksimal ${schema.maxNumber}`;
                    return result;
                }
                break;

            case "boolean":
                if (typeof value !== "boolean") {
                    result.message = `${schema.name} harus berupa boolean`;
                    return result;
                }
                break;

            case "array":
                if (!Array.isArray(value)) {
                    result.message = `${schema.name} harus berupa array`;
                    return result;
                }

                if (schema.items) {
                    const itemSchema = schema.items;
                    if (itemSchema.required && value.length === 0) {
                        result.message = `Array tidak boleh kosong`;
                        return result;
                    }

                    for (let i = 0; i < value.length; i++) {
                        const itemValue = value[i];
                        const itemValidationResult = this.validationValue(itemSchema, itemValue);
                        if (!itemValidationResult.success) {
                            result.message = `${schema.name}[${i}] | ${itemValidationResult.message}`;
                            return result;
                        }
                    }
                }

                break;

            case "object":
                if (typeof value !== "object" || Array.isArray(value)) {
                    result.message = `${schema.name} harus berupa object`;
                    return result;
                } else if (schema.properties) {
                    const propertySchemas = schema.properties;
                    for (const propSchema of propertySchemas) {
                        const propName = propSchema.name;
                        const propValue = value[propName];
                        if (!propSchema.required && !propValue) {
                            if (propSchema.default) {
                                value[propName] = propSchema.default;
                            }

                            continue;
                        } else {
                            const propValidationResult = this.validationValue(propSchema, propValue);
                            if (!propValidationResult.success) {
                                result.message = `${schema.name}.${propName} | ${propValidationResult.message}`;
                                return result;
                            }
                        }
                    }
                }
                break;

            default:
                break;
        }

        result.success = true;
        result.message = "Tidak ada error validasi";
        return result;
    }

    protected checkingPagination(schemas: Validation[], type: "query" | "body" | "params") {
        const req: any = this.request[type];
        let result: {
            success: boolean;
            message: string;
        } = { success: false, message: "" };
        for (const schema of schemas) {
            if (schema.name === "page" || schema.name === "limit") {
                req[schema.name] = parseInt(req[schema.name]);
                if (isNaN(req[schema.name])) {
                    result.message = `${schema.name} Harus berupa number`;
                    return result;
                }
            }

            const checkValue = this.validationValue(schema, req[schema.name]);
            if (!checkValue.success) {
                result = checkValue;
                return result;
            }
            result = checkValue;

            result.success = true;
        }

        return result;
    }

    protected checking(schemas: Validation[], type: "query" | "body" | "params") {
        const req: any = this.request[type];
        let result: {
            success: boolean;
            message: string;
        } = { success: false, message: "" };

        for (const field in req) {
            if (!schemas.find((schema) => schema.name === field)) {
                result.message = `${field} tidak disupport`;
                return result;
            }
        }

        for (const schema of schemas) {
            let value = req[schema.name];

            if (!schema.required && !value) {
                if (schema.default) {
                    req[schema.name] = schema.default;
                    value = req[schema.name];
                } else {
                    continue;
                }
            }

            if (schema.name === "page" || schema.name === "limit") {
                req[schema.name] = parseInt(value);
                value = req[schema.name];
                if (isNaN(value)) {
                    result.success = false;
                    result.message = `${schema.name} Harus berupa number`;
                    return result;
                }
            }

            if (schema.required && !value) {
                result.success = false;
                result.message = `${schema.name} harus diisi`;
                return result;
            } else {
                const resultFromChecking = this.validationValue(schema, value);
                if (!resultFromChecking.success) {
                    result = resultFromChecking;
                    return result;
                }
                result = resultFromChecking;
            }

            result.success = true;
        }

        return result;
    }
}
