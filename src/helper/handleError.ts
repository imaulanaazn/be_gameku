import { ErrorType } from "@enum/index";

export class BusinessError extends Error {
    public readonly type: string;

    constructor(message: string, type: ErrorType) {
        super(message);
        this.name = type;
    }
}
