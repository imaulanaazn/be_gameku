import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "banners",
    timestamps: true,
    underscored: true,
})
export class BannerEntity extends Model<BannerEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    imageUrl!: string;

    @Column(DataType.STRING(255))
    eventUrl!: string;

    @Column(DataType.BOOLEAN)
    external!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
