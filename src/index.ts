import { Markup, Telegraf } from 'telegraf';
const fs = require('fs');
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import { greeting } from './text';
import scrapper from './utils/scrapper';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);


// Define commands and their descriptions
const commands = [
  // {
  //   command: "/start",
  //   description: "Start the bot and get a welcome message.",
  // },
  // {
  //   command: "/seturl <URL>",
  //   description: "Set the URL for scraping job details.",
  // },
  // {
  //   command: "/setkeywords <keywords>",
  //   description: "Set keywords for filtering job positions (comma-separated).",
  // },
  {
    command: "/scrape",
    description:
      "Trigger the scraping process based on the configured settings.",
  },
  {
    command: "/setting",
    description: "View of the settings.",
  },
  // {
  //   command: "/help",
  //   description: "Get information about all available commands.",
  // },
];

// Handle /help command
// bot.command("help", (ctx) => {
//   try {
//     // Generate help message with commands and descriptions
//     const helpMessage = commands
//       .map((cmd) => `${cmd.command}: ${cmd.description}`)
//       .join("\n");
//     ctx.reply(`Available commands:\n\n${helpMessage}`);
//   } catch (error) {
//     console.error("Error:", error);
//     ctx.reply("An error occurred while fetching help information.");
//   }
// });

// Handle /start command
bot.command("start", (ctx) => {
  ctx.reply(
    "Welcome to the job scraper bot! you can change your url and keywords on env file.",
    Markup.keyboard([["/scrape"]])
      .oneTime()
      .resize()
  );
});

// Handle /seturl command
// bot.command("seturl", (ctx) => {
//   const message = ctx.message.text.replace("/seturl", "").trim();
//   const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;

//   if (!message) {
//     ctx.reply(`Please set the URL after the command`);
//     return;
//   }

//   if (!urlRegex.test(message)) {
//     ctx.reply(`Invalid URL format. Please provide a valid URL.`);
//     return;
//   }

//   const url = message;
//   ctx.reply(`URL set: [LINK](${url})`, { parse_mode: "Markdown" });
// });

// Handle /setkeywords command
// bot.command("setkeywords", (ctx) => {
//   const message = ctx.message.text.replace("/setkeywords", "").trim();
//   if (!message) {
//     ctx.reply(`Please set the keywords after the command`);
//     return;
//   }
//   const keywords = message.split(",").map((keyword) => keyword.trim());
//   ctx.reply(`Keywords set to: ${keywords.join(", ")}`);
// });

// Handle /scrape command
bot.command("scrape", async (ctx) => {
  try {
    const url = process.env.SCRAP_URL
    const keywords = (process.env.KEYWORDS ?? '').split(",").map((keyword) => keyword.trim())

    if (!url) {
      return ctx.reply("Please set URL on env.");
    }
    ctx.reply(`please waite for scraping... `);

    scrapper(url, keywords, ctx);
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while scraping job details.");
  }
});

// Handle /start command
bot.command("setting", (ctx) => {
  const url = process.env.SCRAP_URL
  const keywords = process.env.KEYWORDS
  ctx.reply(`URL set to: ${url}\nKeywords set to: ${keywords}`);
});
bot.on('message', greeting());

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
