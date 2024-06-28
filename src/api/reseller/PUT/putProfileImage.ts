import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Config } from "@config/index";
import { v4 as uuid } from "uuid";
import { EncryptionService } from "@serviceInternal/jose.service";
import { APIAuth, APIMethod, JoseKey } from "@enum/index";

const path = "/v1/reseller/image";
const method = APIMethod.PUT;
const auth = APIAuth.RESELLER;

const main: RequestHandler = async (req, res) => {
    const file = req.file;
    const reseller = req.reseller.data;
    const config = new Config();
    const customerService = new CustomerService();
    const firebaseService = new FirebaseService();

    let upload = null;
    if (file) {
        if (reseller.image) {
            await firebaseService.deleteImg(reseller.image);
        }

        upload = await firebaseService.uploadImg(file.path, "user/" + uuid() + file.filename);
    }

    const updateData = {
        image: upload,
    };

    await customerService.updateBy({
        by: "id",
        value: reseller.id,
        data: updateData,
    });

    const encryptService = new EncryptionService(JoseKey.RESELLER);
    const encrypt = await encryptService.encryptData(
        {
            ...reseller,
            image: upload,
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

    return res.sendStatus(200);
};

export const putProfileImage: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        single: true,
        field: "image",
    },
};
