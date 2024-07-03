import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { AdminEntity, ArticleCommentEntity } from ".";
import { ArticleCategoryArticleEntity } from "./articleCategoryArticle.entity";
import { ArticleImageEntity } from "./articleImage.entity";
import { ArticleButtonEntity } from "./articleButton.entity";

@Table({
    tableName: "articles",
    timestamps: true,
    underscored: true,
})
export class ArticleEntity extends Model<ArticleEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => AdminEntity)
    @Column(DataType.STRING(255))
    authorId!: string;

    @Column(DataType.STRING(255))
    title!: string;

    @Column(DataType.STRING(255))
    slug!: string;

    @Column(DataType.STRING(255))
    content!: string;

    @Column(DataType.STRING(255))
    contentPreview!: string;

    @Column(DataType.STRING(255))
    status!: string;

    @Column(DataType.BOOLEAN)
    isPopular!: boolean;

    // @Column(DataType.INTEGER)
    // seqPop!: number;

    @Column(DataType.DATE)
    publishedAt!: Date;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => ArticleCommentEntity, "articleId")
    comments!: ArticleCommentEntity[];

    @HasMany(() => ArticleCategoryArticleEntity, "articleId")
    articleCategoryArticles: ArticleCategoryArticleEntity[];

    @HasMany(() => ArticleImageEntity, "articleId")
    images: ArticleImageEntity[];

    @HasMany(() => ArticleButtonEntity, "articleId")
    buttons: ArticleButtonEntity[];

    @BelongsTo(() => AdminEntity, "authorId")
    author: AdminEntity;
}
