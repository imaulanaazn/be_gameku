import { Config } from "@config/index";
import { APIAuth, APIMethod, EncryptJoseType, JoseKey, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { EncryptionService } from "@serviceInternal/jose.service";
import { RequestHandler } from "express";

const path = "/v1/reseller/update";
const method = APIMethod.PUT;
const auth = APIAuth.RESELLER;

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
];

const main: RequestHandler = async (req, res) => {
    const reseller = req.reseller.data;
    const body = new Validator(req, res).process<{
        name: string;
    }>(schemaValidation, ValidatorType.BODY);

    const customerService = new CustomerService();
    await customerService.updateBy({
        by: "id",
        value: reseller.id,
        data: {
            name: body.name,
        },
    });
    console.log({
        ...reseller,
        name: body.name,
    });
    const encryptService = new EncryptionService(EncryptJoseType.RESELLER);
    const config = new Config();
    const encrypt = await encryptService.encryptData(
        {
            ...reseller,
            name: body.name,
        },
        7,
        "day",
    );
    res.cookie("session_gasskeun_reseller", encrypt, {
        httpOnly: true,
        maxAge: config.maxAgeLogin * 1000,
        // domain: config.domainReseller,
        // path: process.env.NODE_ENV.toLowerCase() === "production" ? "/" : "/reseller",
        // secure: process.env.NODE_ENV.toLowerCase() === "production",
    });
    res.sendStatus(200);
};

export const putReseller: IApiRouter = {
    path,
    method,
    main,
    auth,
};
