import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    UpdatedAt,
} from "sequelize-typescript";
import { OrderStatuses } from "@enum/index";
import { CustomerEntity, InvoiceEntity, PaymentMethodEntity } from ".";

@Table({
    tableName: "orders",
    timestamps: true,
    underscored: true,
})
export class OrderEntity extends Model<OrderEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(40))
    invoiceId!: string;

    @ForeignKey(() => CustomerEntity)
    @Column(DataType.STRING(40))
    customerId!: string;

    @ForeignKey(() => PaymentMethodEntity)
    @Column(DataType.STRING(40))
    paymentMethodId!: string;

    @Column(DataType.INTEGER)
    totalAmt!: number;

    @Column(DataType.INTEGER)
    feeAmt!: number;

    @Column(DataType.INTEGER)
    discAmt!: number;

    @Column(DataType.STRING(255))
    promoCd!: string;

    @Column(DataType.STRING(255))
    status!: OrderStatuses;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @Column(DataType.DATE)
    completedAt!: Date;

    @BelongsTo(() => InvoiceEntity, "invoiceId")
    invoice!: InvoiceEntity;

    @BelongsTo(() => CustomerEntity, "customerId")
    customer!: CustomerEntity;

    @BelongsTo(() => PaymentMethodEntity, "paymentMethodId")
    paymentMethod!: PaymentMethodEntity;
}
