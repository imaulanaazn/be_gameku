import { tgBot } from "./config";

export const botEndpoint = () => {
  tgBot.command("start", async (ctx) => {
    await ctx.reply("Welcome to the Gameku Bot!");
  });

  tgBot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    console.log(ctx.message);
  });
};
