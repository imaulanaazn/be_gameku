import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { ArticleEntity } from "./article.entity";
import { ArticleCategoryEntity } from "./articleCategory.entity";

@Table({
    tableName: "article_category_articles",
    timestamps: true,
    underscored: true,
})
export class ArticleCategoryArticleEntity extends Model<ArticleCategoryArticleEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => ArticleEntity)
    @Column(DataType.STRING(40))
    articleId!: string;

    @ForeignKey(() => ArticleCategoryEntity)
    @Column(DataType.STRING(40))
    articleCategoryId!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => ArticleEntity, { foreignKey: "articleId" })
    article: ArticleEntity;

    @BelongsTo(() => ArticleCategoryEntity, { foreignKey: "articleCategoryId", as: "articleCategory" })
    articleCategory: ArticleCategoryEntity;
}
