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
    tableName: "article_buttons",
    timestamps: true,
    underscored: true,
})
export class ArticleButtonEntity extends Model<ArticleButtonEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => ArticleEntity)
    @Column(DataType.STRING(40))
    articleId!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.STRING(255))
    url!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => ArticleEntity, "articleId")
    article: ArticleEntity;
}
