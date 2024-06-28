import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";
import { AdminEntity } from "./admin.entity";
import { AdminRoleEntity } from "./adminRole.entity";
import { AdminMenuEntity } from "./adminMenu.entity";

@Table({
    tableName: "admin_menu_role",
    underscored: true,
    timestamps: true,
})
export class AdminMenuRoleEntity extends Model<AdminMenuRoleEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @ForeignKey(() => AdminRoleEntity)
    @Column(DataType.STRING(40))
    roleId!: string;

    @ForeignKey(() => AdminMenuEntity)
    @Column(DataType.STRING(40))
    menuId!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;

    @BelongsTo(() => AdminRoleEntity, "roleId")
    role: AdminRoleEntity;

    @BelongsTo(() => AdminMenuEntity, "menuId")
    menu: AdminMenuEntity;
}
