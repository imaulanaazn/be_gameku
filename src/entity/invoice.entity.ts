import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt, HasOne } from "sequelize-typescript";
import { InvoiceStatuses, OrderStatuses } from "@enum/index";
import { OrderEntity } from "./order.entity";

@Table({
    tableName: "invoices",
    timestamps: true,
    underscored: true,
})
export class InvoiceEntity extends Model<InvoiceEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(40))
    xenditId!: string;

    @Column(DataType.STRING(255))
    status!: InvoiceStatuses;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @Column(DataType.DATE)
    expiredAt!: Date;

    @HasOne(() => OrderEntity, "invoiceId")
    order!: OrderEntity;
}
