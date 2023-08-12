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
} from "sequelize-typescript";

@Table({
    tableName: "promotions",
    underscored: true,
    timestamps: true,
})
export class PromotionEntity extends Model<PromotionEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    name!: string;

    @AllowNull(false)
    @Column(DataType.STRING(100))
    discountType!: DiscountType;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    discountValue!: number;

    @Default(0)
    @AllowNull(false)
    @Column(DataType.INTEGER)
    minPurchase!: number;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    description!: string;

    @AllowNull(false)
    @Column(DataType.DATE)
    publishAt!: Date;

    @AllowNull(false)
    @Column(DataType.DATE)
    startAt!: Date;

    @AllowNull(false)
    @Column(DataType.DATE)
    endAt!: Date;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
