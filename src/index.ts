import { Markup, Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import { greeting } from './text';
import scrapper from './utils/scrapper';
import { kv } from '@vercel/kv';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);


// Function to write configuration data
async function writeConfig(chatId: string, config: { [field: string]: unknown; }) {
  try {
    const response = await kv.hset(chatId, config);
    console.log('Configuration updated successfully:', response);
  } catch (error) {
    console.error('Error updating configuration:', error);
  }
}

// Function to read configuration data
async function readConfig(chatId: string) {
  try {
    const response = await kv.hgetall(chatId);
    console.log('Configuration:', response);
    return response
  } catch (error) {
    console.error('Error reading configuration:', error);
  }
}



// Handle /start command
bot.command("start", (ctx) => {
  ctx.reply(
    "Welcome to the job scraper bot! you can change your url and keywords on /setkeywords and /seturl commands.",
    Markup.keyboard([["/scrape", "/setting"], ['/setkeywords', '/seturl']])
      .oneTime()
      .resize()
  );
});

// Handle /seturl command
bot.command("seturl", async (ctx) => {
  const message = ctx.message.text.replace("/seturl", "").trim();
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;

  if (!message) {
    ctx.reply(`Please set the URL after the command`);
    return;
  }

  if (!urlRegex.test(message)) {
    ctx.reply(`Invalid URL format. Please provide a valid URL.`);
    return;
  }

  const url = message;
  await writeConfig(ctx.chat.id.toString(), { url })
  ctx.reply(`URL set: [LINK](${url})`, { parse_mode: "Markdown" });
});

// Handle /setkeywords command
bot.command("setkeywords", async (ctx) => {
  const message = ctx.message.text.replace("/setkeywords", "").trim();
  if (!message) {
    ctx.reply(`Please set the keywords after the command`);
    return;
  }
  const keywords = message.split(",").map((keyword) => keyword.trim());
  await writeConfig(ctx.chat.id.toString(), { keywords: message })
  ctx.reply(`Keywords set to: ${keywords.join(", ")}`);
});

// Handle /scrape command
bot.command("scrape", async (ctx) => {
  try {
    const config = await readConfig(ctx.chat.id.toString())

    const url = config?.url as string ?? ''
    const keywords = (config?.keywords as string ?? '').split(",").map((keyword) => keyword.trim())

    if (!url) {
      return ctx.reply("Please set URL on env.");
    }
    ctx.reply(`please waite for scraping... `);

   await scrapper(url, keywords, ctx);
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while scraping job details.");
  }
});

// Handle /start command
bot.command("setting", async (ctx) => {
  const config = await readConfig(ctx.chat.id.toString())
  ctx.reply(`URL set to: ${config?.url}\nKeywords set to: ${config?.keywords}`);
});
bot.on('message', greeting());

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
