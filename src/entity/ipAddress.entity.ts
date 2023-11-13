import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt } from "sequelize-typescript";
import { InvoiceStatuses, OrderStatuses } from "@enum/index";

@Table({
    tableName: "ip_address",
    timestamps: true,
    underscored: true,
})
export class IPAddressEntity extends Model<IPAddressEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    ip!: string;

    @Column(DataType.STRING(255))
    cd!: string;

    @Column(DataType.STRING(255))
    value!: string;

    @Column(DataType.STRING(255))
    status!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
