import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
    AllowNull,
    ForeignKey,
    Scopes,
    DefaultScope,
    HasMany,
} from "sequelize-typescript";
import { GameEntity } from "./game.entity";

@DefaultScope(() => ({
    attributes: { exclude: ["priceBuy", "resellerPrice"] },
}))
@Scopes(() => ({
    withPriceBuy: {
        attributes: { include: ["priceBuy"] },
    },
    reseller: {
        attributes: { include: ["resellerPrice"] },
    },
}))
@Table({
    tableName: "products",
    timestamps: true,
    underscored: true,
})
export class ProductEntity extends Model<ProductEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId!: string;

    @Column(DataType.STRING(40))
    categoryId!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.BOOLEAN)
    automatically!: boolean;

    @Column(DataType.STRING(255))
    code!: string;

    @Column(DataType.INTEGER)
    price!: number;

    @Column(DataType.INTEGER)
    resellerPrice: number;

    @Column(DataType.INTEGER)
    priceBuy!: number;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    logoDenom: string;

    @Default(false)
    @Column(DataType.BOOLEAN)
    isActive!: boolean;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => GameEntity, "gameId")
    game!: GameEntity;
}
