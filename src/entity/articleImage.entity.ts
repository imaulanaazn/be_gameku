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

@Table({
    tableName: "article_images",
    timestamps: true,
    underscored: true,
})
export class ArticleImageEntity extends Model<ArticleImageEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => ArticleEntity)
    @Column(DataType.STRING(40))
    articleId!: string;

    @Column(DataType.STRING(255))
    path!: string;

    @Column(DataType.STRING(255))
    type!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => ArticleEntity, "articleId")
    article: ArticleEntity;
}
