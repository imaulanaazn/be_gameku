import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo,
    Default,
} from "sequelize-typescript";
import { OrderEntity } from "./order.entity";

@Table({
    tableName: "order_reviews",
    timestamps: true,
    underscored: true,
})
export class OrderReviewEntity extends Model<OrderReviewEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => OrderEntity)
    @Column(DataType.STRING(40))
    orderId!: string;

    @Column(DataType.STRING(255))
    mobileNumber!: string;

    @Column(DataType.TEXT)
    message!: string;

    @Column(DataType.DECIMAL(1, 1))
    rating!: number;

    @Default(false)
    @Column(DataType.BOOLEAN)
    hasUpdated!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => OrderEntity, "orderId")
    order!: OrderEntity;
}
