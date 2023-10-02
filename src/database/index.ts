import { Sequelize } from "sequelize-typescript";
import { Config } from "../config";
import {
    AdminEntity,
    ArticleEntity,
    BannerEntity,
    CommentEntity,
    CustomerEntity,
    GameCategoryEntity,
    GameEntity,
    InvoiceEntity,
    ListServerEntity,
    OrderDetailEntity,
    OrderEntity,
    PaymentMethodEntity,
    ProductEntity,
    PromotionEntity,
    SocialMediaEntity,
    VideoEntity,
    WhatsappTemplateEntity,
} from "@entity/index";
import { SysConfigEntity } from "@entity/sysConfig.entity";

const config = new Config();

const sequelize = new Sequelize({
    host: config.databaseHost,
    database: config.databaseName,
    username: config.databaseUsername,
    password: config.databasePassword,
    logQueryParameters: false,
    logging: false,
    dialect: "mysql",
    models: [
        CustomerEntity,
        GameEntity,
        OrderEntity,
        PaymentMethodEntity,
        ProductEntity,
        PromotionEntity,
        InvoiceEntity,
        OrderDetailEntity,
        BannerEntity,
        ArticleEntity,
        CommentEntity,
        VideoEntity,
        GameCategoryEntity,
        ListServerEntity,
        SysConfigEntity,
        SocialMediaEntity,
        AdminEntity,
        WhatsappTemplateEntity,
    ],
});

sequelize
    .authenticate()
    .then(() => {
        console.log("Berhasil mengkoneksikan ke database");
    })
    .catch((err) => {
        console.error(err.message);
    });

export default sequelize;
