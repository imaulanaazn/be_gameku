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
import { GameEntity } from "./game.entity";

@Table({
    tableName: "list_server",
    timestamps: true,
    underscored: true,
})
export class ListServerEntity extends Model<ListServerEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId!: string;

    @Column(DataType.STRING(255))
    label!: string;

    @Column(DataType.STRING(255))
    value!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => GameEntity, "gameId")
    game!: GameEntity;
}
