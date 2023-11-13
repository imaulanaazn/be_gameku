import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey } from "sequelize-typescript";

@Table({
    tableName: "customers_otp",
    timestamps: true,
    underscored: true,
})
export class CustomerOtpEntity extends Model<CustomerOtpEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    mobileNumber!: string;

    @Column(DataType.STRING(255))
    type!: string;

    @Column(DataType.STRING(255))
    otp!: string;

    @Column(DataType.STRING(255))
    category!: string;

    @Column(DataType.DATE)
    expiredAt!: Date;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
