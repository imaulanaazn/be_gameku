import { MainService } from "./main.service";
import { ArticleDto } from "src/dtos/index";
import { ArticleEntity, CommentEntity } from "@entity/index";
import { col, fn } from "sequelize";
import { IPagination } from "@helper/validator";

interface IFindLatestArticle<T> {
    pagination: IPagination;
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
            limit: criteria.pagination.limit,
            offset: (criteria.pagination.page - 1) * criteria.pagination.limit,
            subQuery: false,
        });
    }

    async countArticles(): Promise<any> {
        return await this.model.count();
    }
}
