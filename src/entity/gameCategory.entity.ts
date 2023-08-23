import {
    AllowNull,
    Column,
    CreatedAt,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { GameEntity } from "./game.entity";

@Table({
    tableName: "games_category",
    timestamps: true,
    underscored: true,
})
export class GameCategoryEntity extends Model<GameCategoryEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    name!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => GameEntity, "categoryId")
    games!: GameEntity[];
}
