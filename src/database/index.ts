import { Sequelize } from "sequelize-typescript";
import { Config } from "../config";
import {
    AdminEntity,
    ArticleEntity,
    BannerEntity,
    CommentEntity,
    CustomerEntity,
    CustomerOtpEntity,
    FundEntity,
    GameCategoryEntity,
    GameEntity,
    GameVoucherEntity,
    InvoiceEntity,
    ListServerEntity,
    MetaEntity,
    OrderDetailEntity,
    OrderEntity,
    OrderPending3rdPartyEntity,
    OrderReviewEntity,
    PaymentMethodEntity,
    ProductCategoryEntity,
    ProductEntity,
    PromotionEntity,
    ProviderEntity,
    ResellerConfigEntity,
    SocialMediaEntity,
    SysConfigEntity,
    VideoEntity,
    WhatsappTemplateEntity,
} from "@entity/index";

const config = new Config();

const sequelize = new Sequelize({
    host: config.databaseHost,
    database: config.databaseName,
    username: config.databaseUsername,
    password: config.databasePassword,
    port: config.databasePort,
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
        GameVoucherEntity,
        CustomerOtpEntity,
        MetaEntity,
        FundEntity,
        ProductCategoryEntity,
        ProviderEntity,
        ResellerConfigEntity,
        OrderReviewEntity,
        OrderPending3rdPartyEntity,
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
