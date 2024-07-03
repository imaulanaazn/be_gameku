import { Request, Response } from "express";
import { ErrorStatusCode, ErrorType } from "@enum/index";
import fs from "fs";

const responseHandler = (error: Error, res: Response, req: Request) => {
    if (error) {
        console.error(error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (req.files) {
            if (Array.isArray(req.files)) {
                req.files.forEach((file) => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            } else {
                Object.keys(req.files).forEach((fieldName) => {
                    const files = req.files[fieldName];
                    files.forEach((file) => {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    });
                });
            }
        }

        switch (error.name) {
            case ErrorType.Authentication:
                res.status(ErrorStatusCode.Authentication);
                break;
            case ErrorType.Authorization:
                res.status(ErrorStatusCode.Authorization);
                break;
            case ErrorType.Validation:
                res.status(ErrorStatusCode.Validation);
                break;
            case ErrorType.NotFound:
                res.status(ErrorStatusCode.NotFound);
                break;
            case ErrorType.Duplicate:
                res.status(ErrorStatusCode.Duplicate);
                break;
            case ErrorType.ToManyRequest:
                res.status(ErrorStatusCode.ToManyRequest);
                break;
            case ErrorType.BadRequest:
                res.status(ErrorStatusCode.BadRequest);
                break;
            default:
                res.status(ErrorStatusCode.Internal);
                break;
        }

        res.send({
            errorCode: error.name,
            message: error.message,
        });
    }
    return res;
};

export default responseHandler;
