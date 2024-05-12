import {
    Table,
    Column,
    Model,
    DataType,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { ProviderEntity } from "./provider.entity";

@Table({
    tableName: "order_pending_3rd_party",
    timestamps: true,
    underscored: true,
})
export class OrderPending3rdPartyEntity extends Model<OrderPending3rdPartyEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => ProviderEntity)
    @Column(DataType.STRING(40))
    providerId!: string;

    @Column(DataType.STRING(255))
    extInvoiceNumber!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => ProviderEntity, "providerId")
    provider!: ProviderEntity;
}
