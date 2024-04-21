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
import { CustomerEntity } from ".";

@Table({
    tableName: "funds",
    timestamps: true,
    underscored: true,
})
export class FundEntity extends Model<FundEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => CustomerEntity)
    @Column(DataType.STRING(40))
    customerId!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.BIGINT)
    value!: number;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => CustomerEntity, "customerId")
    customer!: CustomerEntity;
}
