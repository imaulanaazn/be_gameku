import { Sequelize } from "sequelize-typescript";
import { Config } from "../config";
import {
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
    VideoEntity,
} from "@entity/index";

const config = new Config();

const sequelize = new Sequelize({
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
