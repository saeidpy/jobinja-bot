const { Telegraf, Markup } = require("telegraf");
const main = require("./scraper");

// Load environment variables
require("dotenv").config();

// Create a new instance of Telegraf
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Define variables for URL and keywords
let url = "";
let keywords = [];
let cronSchedule = "0 10 * * *"; // Store the cron schedule string

// Define commands and their descriptions
const commands = [
  {
    command: "/start",
    description: "Start the bot and get a welcome message.",
  },
  {
    command: "/seturl <URL>",
    description: "Set the URL for scraping job details.",
  },
  {
    command: "/setkeywords <keywords>",
    description: "Set keywords for filtering job positions (comma-separated).",
  },
  {
    command: "/scrape",
    description:
      "Trigger the scraping process based on the configured settings.",
  },
  {
    command: "/setting",
    description: "View of the settings.",
  },
  {
    command: "/help",
    description: "Get information about all available commands.",
  },
];

// Handle /help command
bot.command("help", (ctx) => {
  try {
    // Generate help message with commands and descriptions
    const helpMessage = commands
      .map((cmd) => `${cmd.command}: ${cmd.description}`)
      .join("\n");
    ctx.reply(`Available commands:\n\n${helpMessage}`);
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while fetching help information.");
  }
});

// Handle /start command
bot.command("start", (ctx) => {
  ctx.reply(
    "Welcome to the job scraper bot! Use /seturl to set the URL for scraping, /setkeywords to set keywords for filtering job positions.",
    Markup.keyboard([["/scrape", "/setting", "/help"]])
      .oneTime()
      .resize()
  );
});

// Handle /seturl command
bot.command("seturl", (ctx) => {
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

  url = message;
  ctx.reply(`URL set: [LINK](${url})`, { parse_mode: "Markdown" });
});

// Handle /setkeywords command
bot.command("setkeywords", (ctx) => {
  const message = ctx.message.text.replace("/setkeywords", "").trim();
  if (!message) {
    ctx.reply(`Please set the keywords after the command`);
    return;
  }
  keywords = message.split(",").map((keyword) => keyword.trim());
  ctx.reply(`Keywords set to: ${keywords.join(", ")}`);
});

// Handle /scrape command
bot.command("scrape", async (ctx) => {
  try {
    if (!url) {
      return ctx.reply("Please set URL.");
    }
    ctx.reply(`please waite for scraping... `);

    main(url, keywords);
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while scraping job details.");
  }
});

// Handle /start command
bot.command("setting", (ctx) => {
  ctx.reply(`URL set to: ${url}\nKeywords set to: ${keywords.join(", ")}`);
});

// Start the bot
bot.launch();
