import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
    AllowNull,
    ForeignKey,
} from "sequelize-typescript";
import { GameEntity } from "./game.entity";

@Table({
    tableName: "products",
    timestamps: true,
    underscored: true,
})
export class ProductEntity extends Model<ProductEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    name!: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    price!: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    unit!: number;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    unitBonus!: number;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    cd: string;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    logoDenom: string;

    @AllowNull(false)
    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId!: string;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => GameEntity, "gameId")
    game!: GameEntity;
}
