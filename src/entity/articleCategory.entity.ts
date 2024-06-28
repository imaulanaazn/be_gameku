import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";
import { ArticleCategoryArticleEntity } from "./articleCategoryArticle.entity";

@Table({
    tableName: "article_categories",
    timestamps: true,
    underscored: true,
})
export class ArticleCategoryEntity extends Model<ArticleCategoryEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.STRING(255))
    slug!: string;

    @Column(DataType.STRING(255))
    description!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => ArticleCategoryArticleEntity, { foreignKey: "articleCategoryId", as: "articleCategoryArticles" })
    articleCategoryArticles: ArticleCategoryArticleEntity[];
}
