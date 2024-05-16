import { MainService } from "./main.service";
import { ProductDto } from "src/dtos/index";
import { ProductEntity } from "@entity/index";

export class ProductService extends MainService<ProductEntity, ProductDto> {
    constructor() {
        super(ProductEntity);
    }

    async findDenomResellerPriceById({ productId }: { productId?: string }): Promise<ProductEntity> {
        const denom = await this.model.scope("reseller").findOne({
            where: {
                id: productId,
            },
            attributes: { include: ["priceBuy"] },
        });
        return denom;
    }

    async findDenomResellerPricesByGameId({ gameId }: { gameId?: string }): Promise<ProductEntity[]> {
        const denoms = await this.model.scope("reseller").findAll({
            where: {
                gameId: gameId,
                isActive: true,
                deleted: false,
                isDisplayed: true,
            },
            attributes: { include: ["priceBuy"] },
        });
        return denoms;
    }

    async findOneDenomResellerById(productId: string): Promise<ProductEntity> {
        const denoms = await this.model.scope("reseller").findOne({
            where: {
                id: productId,
                deleted: false,
                isActive: true,
                isDisplayed: true,
            },
            attributes: { include: ["priceBuy"] },
        });

        return denoms;
    }
}
