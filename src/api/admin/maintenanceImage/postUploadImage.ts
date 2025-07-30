import { APIMethod, APIAuth, ValidatorType, ErrorType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { ValidatorV2 } from "@helper/validatorV2";
import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { unlinkSync } from "fs";
import Joi from "joi";

const path = "/v1/upload-image";
const method = APIMethod.POST;
const auth = APIAuth.ALL_ADMIN;

const schemaValidation = Joi.object({
  folder: Joi.string().required(),
});

const main: RequestHandler = async (req, res) => {
  const body = new ValidatorV2(req, res).process<{
    folder: string;
  }>(schemaValidation, ValidatorType.BODY);
  const di = req.di;
  const file = req.file;
  if (!file) {
    throw new BusinessError(
      "Tidak ada gambar yang di unggah",
      ErrorType.Validation
    );
  }

  const mimePattern = /^image\/(jpeg|jpg|png|gif)$/;
  if (!mimePattern.test(file.mimetype)) {
    throw new BusinessError(
      "Hanya gambar yang bisa di unggah",
      ErrorType.BadRequest
    );
  }

  await di.minioService.uploadFile({
    bucketName: "topupgameku",
    filename: req.file.filename,
    folder: body.folder,
    filePath: req.file.path,
  });

  const baseImageUrl = di.config.imageUrl;
  const imgUrl = `${baseImageUrl}/${body.folder}/${req.file.filename}`;

  res.send({
    url: imgUrl,
  });
};

export const postUploadImage: IApiRouter = {
  path,
  method,
  main,
  auth,
  isUploadImage: true,
  dataImg: {
    field: "image",
    single: true,
  },
};
