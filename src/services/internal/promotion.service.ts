import { MainService } from "./main.service";
import { PromotionDto } from "src/dtos/index";
import { PromotionEntity } from "@entity/index";
import { Op } from "sequelize";

export class PromotionService extends MainService<PromotionEntity, PromotionDto> {
    constructor() {
        super(PromotionEntity);
    }

    async findAvailablePromoBypromoCode(promoCode: string): Promise<PromotionEntity> {
        try {
            const dateNow = new Date();
            const voucher = await PromotionEntity.findOne({
                where: {
                    id: promoCode,
                    endAt: {
                        [Op.gt]: dateNow,
                    },
                    startAt: {
                        [Op.lte]: dateNow,
                    },
                    deleted: false,
                },
            });
            return voucher;
        } catch (error) {
            throw error;
        }
    }
}
