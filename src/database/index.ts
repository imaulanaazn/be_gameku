import { Sequelize } from "sequelize-typescript";
import { Config } from "../config";
import {
    BannerEntity,
    CustomerEntity,
    GameEntity,
    InvoiceEntity,
    OrderDetailEntity,
    OrderEntity,
    PaymentMethodEntity,
    ProductEntity,
    PromotionEntity,
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
