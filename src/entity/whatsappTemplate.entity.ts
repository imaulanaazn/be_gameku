import { Table, Column, Model, DataType, PrimaryKey, CreatedAt, UpdatedAt, Unique } from "sequelize-typescript";

@Table({
    tableName: "whatsapp_templates",
    underscored: true,
    timestamps: true,
})
export class WhatsappTemplateEntity extends Model<WhatsappTemplateEntity> {
    @PrimaryKey
    @Column(DataType.STRING(40))
    id!: string;

    @Column(DataType.STRING(255))
    title!: string;

    @Column(DataType.TEXT)
    content!: string;

    @Column(DataType.STRING(255))
    template!: string;

    @Unique(true)
    @Column(DataType.STRING(255))
    cd!: string;

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
}
