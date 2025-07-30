import { IApiRouter } from "@interfaces/index";
import { RequestHandler } from "express";
import { Config } from "@config/index";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/admin/logout";
const method = APIMethod.DELETE;
const auth = APIAuth.ALL_ADMIN;

const main: RequestHandler = async (req, res) => {
  res.clearCookie("session_gameku_admin", {
    httpOnly: true,
  });

  return res.sendStatus(200);
};

export const deleteLogoutAdmin: IApiRouter = {
  path,
  method,
  main,
  auth,
};
