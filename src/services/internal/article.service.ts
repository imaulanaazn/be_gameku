import { MainService } from "./main.service";
import { ArticleDto } from "src/dtos/index";
import { ArticleEntity, CommentEntity } from "@entity/index";
import { col, fn } from "sequelize";

interface IFindLatestArticle<T> {
    max: number;
    attributes: Array<keyof T>;
}

export class ArticleService extends MainService<ArticleEntity, ArticleDto> {
    constructor() {
        super(ArticleEntity);
    }

    async findLastArticleAndTotalComments(criteria: IFindLatestArticle<ArticleDto>): Promise<any> {
        return await this.model.findAll({
            attributes: [...criteria.attributes, [fn("COUNT", col("comments.id")), "totalComments"]],
            include: [
                {
                    model: CommentEntity,
                    attributes: [],
                },
            ],
            where: {
                isPublished: true,
            },
            group: ["ArticleEntity.id", "ArticleEntity.title"],
            order: [["publishDate", "DESC"]],
            limit: criteria.max,
            subQuery: false,
        });
    }
}
