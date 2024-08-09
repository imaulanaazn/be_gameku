import { APIAuth, APIMethod, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { RequestHandler } from "express";

const path = "/v1/dropdown-game-category";
const method = APIMethod.GET;
const auth = APIAuth.ADMIN;

const main: RequestHandler = async (req, res) => {
    const gameCategoryService = new GameCategoryService();
    const gameCategories = await gameCategoryService.model.findAll({
        attributes: ["id", "name"],
    });

    return res.send(gameCategories);
};

export const dropdownGameCategory: IApiRouter = {
    main,
    path,
    method,
    auth,
};
