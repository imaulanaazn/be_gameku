import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt, AllowNull } from "sequelize-typescript";
import { DurationCD, FeeType, PaymentsCategory } from "@enum/index";

@Table({
    tableName: "payments_method",
    underscored: true,
    timestamps: true,
})
export class PaymentMethodEntity extends Model<PaymentMethodEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    name!: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    minAmount!: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    maxAmount!: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    fee!: number;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    feeType!: FeeType;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    cd!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    category!: PaymentsCategory;

    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    isSingleUse!: boolean;

    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    isActive!: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    durationExpired!: number;

    @AllowNull(false)
    @Column(DataType.STRING(10))
    durationCd!: DurationCD;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    logo!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
