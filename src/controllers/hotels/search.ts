import Express from "express";
import jsdom from "jsdom";
import { toDecimalSep, fetchData, dateToString, extract_numbers } from "../../common";

module.exports.search = async function(req: Express.Request, res: Express.Response) {
    if (!req.query.name) {
        res.send("No name provided");
        return;
    }
    const debug = req.query.debug || false;

    const hotelName = req.query.name;
    const lang = req.query.lang || "en-gb";
    const no_adults = req.query.no_adults || 1;
    const no_children = req.query.no_children || 0;
    const no_rooms = req.query.no_rooms || 1;
    const leisure = req.query.leisure || true;
    const entireProperty = req.query.entireProperty || true;
    const checkin = req.query.checkin || dateToString(new Date());
    const dateCheckin = new Date(String(req.query.checkin)) || new Date();
    const checkout = req.query.checkout || dateToString(new Date(dateCheckin.getTime() + 24 * 60 * 60 * 1000));

    const url = `https://www.booking.com/searchresults.${lang}.html?ss=${hotelName}&checkin=${checkin}&checkout=${checkout}&no_rooms=${no_rooms}&group_children=${no_children}&group_adults=${no_adults}&sb_travel_purpose=${leisure ? "leisure" : "business"}&sb_entire_place=${Number(Boolean(entireProperty))}`;

    const headers = { "Accept-Language": `${lang};q=0.9` };
    const page = await fetchData(url, headers, Boolean(debug));

    if (page.content == undefined) {
        return;
    }

    const dom = page.content;

    const hotels = dom.window.document.querySelectorAll("div.d20f4628d0");

    type hotelItem = {
        name: string;
        rating: number;
        rating_text: string;
        no_reviews: number;
        selling_points: string[];
        price: string;
        distance: string;
        url: string;
        location_url: string;
        image: string;
    }


    let results: hotelItem[] = [];

    hotels.forEach((hotel) => {
        let hotelItem: hotelItem = {} as hotelItem;

        hotelItem.name = hotel.querySelector("div.fcab3ed991")?.textContent || "undefined";

        const ratingNumStr = hotel.querySelector("div.b5cd09854e")?.textContent || "";
        if (ratingNumStr.length > 0) {
            hotelItem.rating = extract_numbers(ratingNumStr)[0];
        } else {
            hotelItem.rating = 0;
        }

        hotelItem.rating_text = (hotel.querySelector("div.b5cd09854e.f0d4d6a2f5.e46e88563a")?.textContent || "").trimEnd();

        const noReviewsStr = hotel.querySelector("div.b1e6dd8416.aacd9d0b0a.b48795b3df")?.textContent || "";
        console.log(noReviewsStr);
        if (noReviewsStr.length > 0) {
            hotelItem.no_reviews = noReviewsStr.replaceAll(",", "").match(/\d+/g)?.map((item) => { return Number(item) })[0] || 0;
        } else {
            hotelItem.no_reviews = 0;
        }

        hotelItem.distance = hotel.querySelector("[data-testid='distance']")?.innerHTML || "";

        results.push(hotelItem);

    });


    res.send({ searchResults: results, debug: { page: page.debug, url: url } });

}



