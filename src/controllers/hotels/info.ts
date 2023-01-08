import axios from "axios";
import Express, { response } from "express";
import jsdom from "jsdom";
import { toDecimalSep } from "../../common";
const randomUserAgent = require("random-useragent");


import "../../common.ts"
module.exports.info = async function(req: Express.Request, res: Express.Response) {

    if (!req.query.name) {
        res.status(400).send("No name provided");
        return;
    }

    const hotelName = req.query.name;
    const hotelCountry = req.query.country || "pl";
    const lang = req.query.lang || "en";

    const url = `https://www.booking.com/hotel/${hotelCountry}/${hotelName}.${lang}.html`;

    const headers = {
        "User-Agent": randomUserAgent.getRandom(),
        "DNT": "1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Language": `${lang};q=0.9`,
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
    }

    const page = await axios.get(url, { headers }).then((response) => {
        return response;
    }).catch((error) => {
        res.send({ message: error.message, name: error.name });
    });

    if (page === undefined) {
        return;
    }

    const dom = new jsdom.JSDOM(page.data);
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


    res.send({ description: desc, ammenities: ammenitiesArray, overallRating: rating, reviewCategories: reviewCategoriesObj, url });

}

