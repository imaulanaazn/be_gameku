import {
    Table,
    Column,
    Model,
    DataType,
    Default,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    Unique,
} from "sequelize-typescript";

@Table({
    tableName: "games",
    timestamps: true,
    underscored: true,
})
export class GameEntity extends Model<GameEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(40))
    name!: string;

    @Column(DataType.STRING(255))
    logoUrl: string;

    @Column(DataType.STRING(255))
    platform: string;

    @Column(DataType.STRING(255))
    category: string;

    @Default(false)
    @Column(DataType.BOOLEAN)
    isPopular: boolean;

    @Default(false)
    @Column(DataType.INTEGER)
    popSequence: number;

    @Unique(true)
    @Column(DataType.STRING(255))
    slug: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @Default(false)
    @Column(DataType.BOOLEAN)
    deleted!: boolean;
}
