import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt, AllowNull } from "sequelize-typescript";

@Table({
    tableName: "videos",
    underscored: true,
    timestamps: true,
})
export class VideoEntity extends Model<VideoEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    url!: string;

    @AllowNull(false)
    @Column(DataType.STRING(255))
    videoId!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
