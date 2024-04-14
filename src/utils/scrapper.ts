import { load } from "cheerio";
const JDate = require('jalali-date');
import { Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";


// Function to scrape the website and collect links
async function scrapeAndCollectLinks(
    _url: string,
    page: number = 1,
    collectedLinks: Set<string> = new Set()
): Promise<string[]> {
    try {
        // Construct URL with page parameter
        const url = `${_url}&page=${page}`;

        // Fetch HTML from the URL
        const response = await fetch(url, { headers: { 'user-agent': 'PostmanRuntime/7.37.3' } });

        if (response.ok) {
            const html = await response.text();

            // Parse HTML using Cheerio
            const $ = load(html);

            // Check if no results found
            if ($("div.c-jobSearch__noResult").length > 0) {
                console.log("No more results found. Stopping pagination.");
                return Array.from(collectedLinks); // Convert Set to Array
            }

            // Extract links from the ul.c-jobListView__list
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
                        collectedLinks.add(modifiedLink); // Add to Set to ensure uniqueness
                    }
                });

            // Continue pagination and collect links
            return scrapeAndCollectLinks(_url, page + 1, collectedLinks);
        }
        return []
    } catch (error: any) {
        console.error("Error:", error);
        return []
    }
}

// Function to scrape each link and collect data
async function scrapeLink(_keywords: string[] = [], link: string) {
    try {
        // Fetch HTML from the link with a delay
        await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust the delay as needed
        const response = await fetch(link, { headers: { 'user-agent': 'PostmanRuntime/7.37.3' } });
        if (response.ok) {

            const html = await response.text();
            // Parse HTML using Cheerio
            const $ = load(html);

            // Define keywords to filter positions
            const keywords = _keywords;

            // Extract data from each <li> element in the specified <ul>
            const jobDetails = $(
                "section:not([class]) ul.o-listView__list.c-jobListView__list li.o-listView__item"
            )
                .map((index, element) => {
                    const $element = $(element);
                    // Extract company name
                    const companyName = $element
                        .find("div > div.o-listView__itemInfo > ul > li:nth-child(1) > span")
                        .text()
                        .trim();
                    // Extract position
                    const position = $element
                        .find("div > div.o-listView__itemInfo > h2 > a")
                        .text()
                        .trim();
                    // Extract link
                    const jobLink = $element
                        .find("div > div.o-listView__itemInfo > h2 > a")
                        .attr("href");
                    // Check if position name includes any of the keywords
                    const filtered = keywords.some((keyword) =>
                        position.toLowerCase().includes(keyword)
                    );
                    // Return job details if position matches any keyword
                    if (filtered) {
                        return { companyName, position, jobLink };
                    }
                    return null;
                })
                .get()
                .filter(Boolean); // Remove null values

            return jobDetails.length ? jobDetails : []; // Return an empty array if no matching job details are found
        }
        return []
    } catch (error: any) {
        console.error("Error:", error);
        throw Error(error)
    }
}

function splitArrayChunks<T>(array: T[], n: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += n) {
        result.push(array.slice(i, i + n));
    }
    return result;
}

// Function to send collected job details to Telegram
async function sendJobDetailsToTelegram(ctx: Context<Update>, jobDetails: {
    companyName?: string;
    position?: string;
    jobLink?: string;
}[]) {
    const jdate = new JDate();
    try {
        if (jobDetails.length > 0) {
            const messageHeader = `${jobDetails.length} Postion found\n`;
            const nowDate = `Date: ${jdate.format("dddd DD MMMM YYYY")}\n\n`;
            const chunksOfJobs = splitArrayChunks(jobDetails, 12);
            let counter = 0
            const jobDetailsText = chunksOfJobs.map(
                (jobDetails, indx) =>
                    messageHeader +
                    nowDate +
                    jobDetails
                        .map(
                            (job) => {
                                counter++
                                return `${counter}: Company Name: ${job?.companyName}\nPosition: [${job?.position}](${job?.jobLink})\n`
                            }
                        )
                        .join("\n\n")
            );

            // Send each chunk as a separate message
            for (const chunk of jobDetailsText) {
                // Send message to Telegram chat
                await ctx.reply(chunk, {
                    parse_mode: "Markdown",
                });
            }

            console.log("All job details sent successfully!");
        } else {
            console.log("No job details found.");
        }
    } catch (error: any) {
        const message = new Error(error).message
        ctx.reply(message as string)
        console.error("Error sending job details to Telegram:", error);
    }
}

// Main function to orchestrate scraping and sending job details
async function scrapper(url: string, keywords: string[], ctx: Context<Update>) {
    try {
        const collectedLinks = await scrapeAndCollectLinks(url);
        ctx.reply(`Log:${collectedLinks.length} companes found`)
        // Loop through collected links and scrape job details
        const jobDetails: {
            companyName?: string;
            position?: string;
            jobLink?: string;
        }[] = [];
        for (const link of collectedLinks) {
            const jobDetail = await scrapeLink(keywords, link);
            if (jobDetail) {
                jobDetails.push(...jobDetail);
            }
        }

        // Send all job details to Telegram
        await sendJobDetailsToTelegram(ctx, jobDetails);
    } catch (error: any) {
        const message = new Error(error).message
        ctx.reply(message as string)
        console.error("Error:", error);
    }
}

export default scrapper;
