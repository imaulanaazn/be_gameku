import {
    Column,
    CreatedAt,
    DataType,
    DefaultScope,
    HasMany,
    Model,
    PrimaryKey,
    Scopes,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { AdminUserRoleEntity } from "./AdminUserRole";

@Table({
    tableName: "admin",
    timestamps: true,
    underscored: true,
})
@DefaultScope(() => ({
    attributes: { exclude: ["password", "role"] },
}))
@Scopes(() => ({
    withPassword: {
        attributes: { include: ["password"] },
    },
}))
export class AdminEntity extends Model<AdminEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.STRING(255))
    username!: string;

    @Column(DataType.STRING(255))
    password!: string;

    @Column(DataType.BOOLEAN)
    deleted!: boolean;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @HasMany(() => AdminUserRoleEntity, "userId")
    roles!: AdminUserRoleEntity[];
}
