import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "sys_config",
    underscored: true,
    timestamps: true,
})
export class SysConfigEntity extends Model<SysConfigEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.TEXT)
    value!: string;

    @Column(DataType.STRING(255))
    cd!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
