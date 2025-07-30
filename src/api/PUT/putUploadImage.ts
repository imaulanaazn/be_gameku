import {
  APIAuth,
  APIMethod,
  EncryptJoseType,
  ErrorType,
  ValidatorType,
} from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { Validation, IApiRouter } from "@interfaces/index";
import { CustomerService } from "@serviceInternal/customer.service";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { Config } from "@config/index";
import { EncryptionService } from "@serviceInternal/jose.service";

const path = "/v1/customer/image";
const method = APIMethod.PUT;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [
  {
    name: "id",
    type: "string",
    required: true,
  },
];

const main: RequestHandler = async (req, res) => {
  const query = new Validator(req, res).process<{
    id: string;
  }>(schemaValidation, ValidatorType.QUERY);
  const file = req.file;
  const config = new Config();

  const customerService = new CustomerService();
  const customer = await customerService.model.scope("withPassword").findOne({
    where: {
      id: query.id,
      isActive: true,
    },
  });

  if (!customer) {
    throw new BusinessError("Customer tidak valid", ErrorType.BadRequest);
  }

  const firebaseService = new FirebaseService();

  let upload = null;
  if (file) {
    if (customer.image) {
      await firebaseService.deleteImg(customer.image);
    }

    upload = await firebaseService.uploadImg(
      file.path,
      "user/" + file.filename
    );
  }

  const updateData = {
    image: upload,
  };

  const encryptService = new EncryptionService(EncryptJoseType.USER);
  const encrypt = await encryptService.encryptData(
    {
      ...customer.dataValues,
      password: undefined,
      ...updateData,
    },
    1,
    "week"
  );

  res.cookie("session_gameku_user", encrypt, {
    httpOnly: true,
    maxAge: config.maxAgeLogin * 1000,
    // domain: config.domainReseller,
    // path: "/",
    // secure: process.env.NODE_ENV.toLowerCase() === "production",
    // sameSite: "none",
  });

  await customerService.updateBy({
    by: "id",
    value: query.id,
    data: updateData,
  });

  return res.send({
    ...customer.dataValues,
    password: undefined,
    ...updateData,
  });
};

export const putCustomerImage: IApiRouter = {
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
