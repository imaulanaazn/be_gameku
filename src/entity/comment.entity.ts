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
    tableName: "comments",
    timestamps: true,
    underscored: true,
})
export class CommentEntity extends Model<CommentEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => ArticleEntity)
    @Column(DataType.STRING(40))
    articleId!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.STRING(255))
    email!: string;

    @Column(DataType.TEXT)
    content!: string;

    @Column(DataType.STRING(255))
    status!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => ArticleEntity, "articleId")
    article!: ArticleEntity;
}
