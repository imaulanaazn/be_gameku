import { MainService } from "./main.service";
import { GameCategoryDto } from "src/dtos/index";
import { GameCategoryEntity, GameEntity } from "@entity/index";

export class GameCategoryService extends MainService<GameCategoryEntity, GameCategoryDto> {
    constructor() {
        super(GameCategoryEntity);
    }

    async findGameCategoryWithGame(limit: number): Promise<any> {
        return await this.model.findAll({
            include: [
                {
                    model: GameEntity,
                    where: {
                        deleted: false,
                    },
                },
            ],
            limit,
        });
    }
}
