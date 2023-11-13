import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, Unique } from "sequelize-typescript";

@Table({
    tableName: "meta",
    timestamps: true,
    underscored: true,
})
export class MetaEntity extends Model<MetaEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Unique
    @Column(DataType.STRING(255))
    path!: string;

    @Column(DataType.STRING(255))
    title!: string;

    @Unique
    @Column(DataType.STRING(255))
    slug!: string;

    @Column(DataType.TEXT)
    description!: string;

    @Column(DataType.TEXT)
    keywords!: string;

    @Column(DataType.TEXT)
    icon!: string;

    @Column(DataType.TEXT)
    image!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
