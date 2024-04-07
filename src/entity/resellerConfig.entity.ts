import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "resellers_config",
    underscored: true,
    timestamps: true,
})
export class ResellerConfigEntity extends Model<ResellerConfigEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(40))
    resellerId!: string;

    @Column(DataType.STRING(255))
    percentageMargin!: string;

    @Column(DataType.STRING(40))
    apiKey!: string;

    @Column(DataType.STRING(40))
    webhookApiKey!: string;

    @Column(DataType.STRING(255))
    webhookCallbackUrl!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
