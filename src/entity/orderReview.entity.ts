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
import { GameEntity } from "./game.entity";
import { ProductEntity } from "./product.entity";

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

    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId!: string;

    @ForeignKey(() => ProductEntity)
    @Column(DataType.STRING(40))
    productId!: string;

    @Column(DataType.STRING(255))
    mobileNumber!: string;

    @Column(DataType.STRING(255))
    gameName!: string;

    @Column(DataType.STRING(255))
    productName!: string;

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

    @BelongsTo(() => OrderEntity, "orderId")
    game!: OrderEntity;

    @BelongsTo(() => OrderEntity, "orderId")
    product!: OrderEntity;
}
