import {
    Column,
    CreatedAt,
    DataType,
    DefaultScope,
    Model,
    PrimaryKey,
    Scopes,
    Table,
    UpdatedAt,
} from "sequelize-typescript";

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
    withRole: {
        attributes: { include: ["role"] },
    },
    all: {
        attributes: { include: ["password", "role"] },
    },
}))
export class AdminEntity extends Model<AdminEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    name!: string;

    @Column(DataType.STRING(255))
    role!: string;

    @Column(DataType.STRING(255))
    username!: string;

    @Column(DataType.STRING(255))
    password!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
