import axios from "axios";
import Express, { response } from "express";
import jsdom from "jsdom";
import { toDecimalSep, fetchData } from "../../common";
const randomUserAgent = require("random-useragent");

module.exports.info = async function(req: Express.Request, res: Express.Response) {

    if (!req.query.name) {
        res.status(400).send("No name provided");
        return;
    }

    const debug: boolean = Boolean(req.query.debug) || false

    const hotelName = req.query.name;
    const hotelCountry = req.query.country || "pl";
    const lang = req.query.lang || "en";

    const url = `https://www.booking.com/hotel/${hotelCountry}/${hotelName}.${lang}.html`;
    const headers = { "Accept-Language": `${lang};q=0.9` };

    const startScrapeTime = new Date();
    const page = await fetchData(url, headers, debug);

    if (page.content == null) {
        if (debug) {
            res.send({ error: "No content", debug: page.debug, url });
        }
        res.send("An error occurred")
        return;
    }

    const dom = page.content;

    const endParseTime = new Date();

    let desc = dom.window.document.querySelectorAll("div.hp_desc_main_content")[0]?.textContent

    // remove all newlines in description
    if (desc) {
        desc = desc?.replace(/(\r\n|\n|\r)/gm, "");
    }

    const ammenities = dom.window.document.querySelectorAll("div.important_facility")
    const ammenitiesArray: string[] = [];
    ammenities.forEach((ammenity) => {
        if (ammenity.textContent) {
            ammenitiesArray.push(ammenity.textContent.replace(/(\r\n|\n|\r)/gm, ""));
        }
    });

    const rating = dom.window.document.querySelectorAll("div.b5cd09854e")[0]?.textContent?.trim().replace(",", '.').trim();

    const reviewCategories = dom.window.document.querySelectorAll("div.cfc0860887");
    let reviewCategoriesObj: any = {};
    reviewCategories.forEach((reviewCategory) => {

        if (reviewCategory.textContent) {
            const splitRe = new RegExp("^.*?(?=[0-9])", "g");
            let category: any = reviewCategory.textContent?.match(splitRe)

            const words = reviewCategory.textContent?.split(" ");
            const score = toDecimalSep(words[words.length - 1]);

            if (category != undefined) {
                reviewCategoriesObj[category[0].trim()] = score;
            }
        }
    });

    const endExecuteTime = new Date();

    const debugVals = {
        total: endExecuteTime.getTime() - startScrapeTime.getTime(),
        executeTime: endExecuteTime.getTime() - endParseTime.getTime(),
    }

    let response = { description: desc, ammenities: ammenitiesArray, overallRating: rating, reviewCategories: reviewCategoriesObj };

    if (debug) {
        res.send(Object.assign(response, { debug: { timing: debugVals, fetch: page.debug, url } }));
    } else {
        res.send(Object.assign(response, {}));
    }
}

