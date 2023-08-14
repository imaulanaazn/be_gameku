import {
    Column,
    CreatedAt,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    Unique,
    UpdatedAt,
} from "sequelize-typescript";
import { CommentEntity } from ".";

@Table({
    tableName: "articles",
    timestamps: true,
    underscored: true,
})
export class ArticleEntity extends Model<ArticleEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    title!: string;

    @Column(DataType.STRING(255))
    img!: string;

    @Column(DataType.TEXT)
    content!: string;

    @Column(DataType.STRING(255))
    category!: string;

    @Column(DataType.BOOLEAN)
    isExternal!: boolean;

    @Column(DataType.STRING(255))
    externalUrl!: string;

    @Unique(true)
    @Column(DataType.STRING(255))
    slug!: string;

    @Column(DataType.BOOLEAN)
    isPublished!: boolean;

    @Column(DataType.DATE)
    publishDate!: Date;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => CommentEntity, "articleId")
    comments!: CommentEntity[];
}
