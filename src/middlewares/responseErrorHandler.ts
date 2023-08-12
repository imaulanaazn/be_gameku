import { Response } from "express";
import { ErrorStatusCode, ErrorType } from "@enum/index";

const responseHandler = (error: Error, res: Response) => {
    if (error) {
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
