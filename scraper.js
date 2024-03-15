const axios = require("axios");
const cheerio = require("cheerio");
const { Telegraf } = require("telegraf");

// Load environment variables
require("dotenv").config();

// Create a new instance of Telegraf
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Function to scrape the website and send a message to Telegram
async function scrapeAndSendMessage() {
  try {
    // Fetch HTML from the provided URL in environment variables
    const response = await axios.get(process.env.URL);
    const html = response.data;

    // Parse HTML using Cheerio
    const $ = cheerio.load(html);

    // Extract links from the ul.c-jobListView__list
    const links = [];
    $("ul.c-jobListView__list")
      .find("li")
      .each((index, element) => {
        const link = $(element)
          .find("div.o-listView__itemInfo > a")
          .attr("href");
        if (link) {
          // Split the link at the fifth occurrence of '/'
          const parts = link.split("/");
          const modifiedLink = parts.slice(0, 6).join("/");
          links.push(modifiedLink);
        }
      });

    // Send the links to Telegram
    if (links.length > 0) {
      const message = links.join("\n");
      // Send message to Telegram chat
      bot.telegram
        .sendMessage(process.env.TELEGRAM_CHAT_ID, message)
        .then((res) => {
          console.log("Message sent successfully!");
        })
        .catch((e) => {
          console.log("🚀 ~ bot.telegram.sendMessage ~ e:", e);
        });
    } else {
      console.log("No links found.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function to scrape and send message
scrapeAndSendMessage();

// Start polling for updates
bot.startPolling();
