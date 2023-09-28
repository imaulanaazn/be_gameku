import { MainService } from "./main.service";
import { GameDto } from "src/dtos/index";
import { GameEntity } from "@entity/index";

export class GameService extends MainService<GameEntity, GameDto> {
    constructor() {
        super(GameEntity);
    }

    async findGameByCategory(categoryId: string): Promise<GameEntity[]> {
        const games = await this.model.findAll({
            where: {
                categoryId,
                isPopular: false,
            },
        });

        return games;
    }
}
