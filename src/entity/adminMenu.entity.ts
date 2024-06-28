import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "admin_menu",
    underscored: true,
    timestamps: true,
})
export class AdminMenuEntity extends Model<AdminMenuEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    title!: string;

    @Column(DataType.STRING(255))
    path!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
