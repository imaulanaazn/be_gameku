import { Config } from "../config";
const { Bot } = require("grammy");

const config = new Config();
export const tgBot = new Bot(config.adminTelegramBotToken);
