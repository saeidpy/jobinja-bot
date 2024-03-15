const { Telegraf } = require("telegraf");
const cron = require("node-cron");
const main = require("./scraper");

// Load environment variables
require("dotenv").config();

// Create a new instance of Telegraf
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Define variables for URL and keywords
let url = "";
let keywords = [];
let cronSchedule = ""; // Store the cron schedule string

// Handle /start command
bot.command("start", (ctx) => {
  ctx.reply(
    "Welcome to the job scraper bot! Use /seturl to set the URL for scraping, /setkeywords to set keywords for filtering job positions, and /setschedule to set the schedule for running the scraping process."
  );
});

// Handle /seturl command
bot.command("seturl", (ctx) => {
  const message = ctx.message.text.replace("/seturl", "").trim();
  url = message;
  ctx.reply(`URL set to: ${url}`);
});

// Handle /setkeywords command
bot.command("setkeywords", (ctx) => {
  const message = ctx.message.text.replace("/setkeywords", "").trim();
  keywords = message.split(",").map((keyword) => keyword.trim());
  ctx.reply(`Keywords set to: ${keywords.join(", ")}`);
});

// Handle /setschedule command
bot.command("setschedule", (ctx) => {
  const message = ctx.message.text.replace("/setschedule", "").trim();
  cronSchedule = message;
  ctx.reply(`Cron schedule set to: ${cronSchedule}`);
});

// Handle /scrape command
bot.command("scrape", async (ctx) => {
  try {
    if (!url || !keywords.length || !cronSchedule) {
      return ctx.reply(
        "Please set URL, keywords, and cron schedule before triggering scraping."
      );
    }

    main();
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("An error occurred while scraping job details.");
  }
});

// Schedule cron job based on the dynamic schedule set by the user
cron.schedule(cronSchedule, async () => {
  console.log("Running scraping process...");
  try {
    if (!url || !keywords.length) {
      console.error("URL and keywords are not set. Aborting scraping.");
      return;
    }

    main();
  } catch (error) {
    console.error("Error:", error);
  }
});

// Start the bot
bot.launch();
