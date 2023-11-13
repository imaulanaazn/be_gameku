import { BelongsTo, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";
import { GameEntity } from "./game.entity";
import { ProductEntity } from "./product.entity";

@Table({
    tableName: "game_vouchers",
    timestamps: true,
    underscored: true,
})
export class GameVoucherEntity extends Model<GameVoucherEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(40))
    gameId!: string;

    @Column(DataType.STRING(40))
    productId!: string;

    @Column(DataType.STRING(255))
    code!: string;

    @Column(DataType.BOOLEAN)
    used!: boolean;

    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => GameEntity, "gameId")
    game: GameEntity;

    @BelongsTo(() => ProductEntity, "productId")
    product: ProductEntity;
}
