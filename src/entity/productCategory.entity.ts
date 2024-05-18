import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    HasMany,
} from "sequelize-typescript";
import { GameEntity } from "./game.entity";
import { ProductEntity } from "./product.entity";

@Table({
    tableName: "product_categories",
    timestamps: true,
    underscored: true,
})
export class ProductCategoryEntity extends Model<ProductCategoryEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => GameEntity)
    @Column(DataType.STRING(40))
    gameId!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.INTEGER)
    catSequence!: number;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => ProductEntity, "categoryId")
    products!: ProductEntity[];
}
