import {
    Table,
    Column,
    Model,
    DataType,
    Default,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    Unique,
    AllowNull,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { GameCategoryEntity } from "./gameCategory.entity";

@Table({
    tableName: "games",
    timestamps: true,
    underscored: true,
})
export class GameEntity extends Model<GameEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => GameCategoryEntity)
    @Column(DataType.STRING(40))
    categoryId!: string;

    @Column(DataType.STRING(40))
    name!: string;

    @Column(DataType.STRING(255))
    logoUrl: string;

    @Default(false)
    @Column(DataType.BOOLEAN)
    isPopular: boolean;

    @Default(false)
    @Column(DataType.INTEGER)
    popSequence: number;

    @Unique(true)
    @Column(DataType.STRING(255))
    slug: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    logoDenom: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @Default(false)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @BelongsTo(() => GameCategoryEntity, "categoryId")
    gameCategory!: GameCategoryEntity;
}
