import { DiscountType } from "@enum/index";
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    AllowNull,
    ForeignKey,
} from "sequelize-typescript";
import { GameEntity } from "./game.entity";

@Table({
    tableName: "promotions",
    underscored: true,
    timestamps: true,
})
export class PromotionEntity extends Model<PromotionEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    code: string;

    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId: string;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    name!: string;

    @AllowNull(true)
    @Column(DataType.STRING(100))
    discountType!: DiscountType;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    discountValue!: number;

    @Default(0)
    @AllowNull(true)
    @Column(DataType.INTEGER)
    minPurchase!: number;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    maxDiscount!: number;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    description!: string;

    @AllowNull(true)
    @Column(DataType.DATE)
    startAt!: Date;

    @AllowNull(true)
    @Column(DataType.DATE)
    endAt!: Date;

    @Default(true)
    @AllowNull(true)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
