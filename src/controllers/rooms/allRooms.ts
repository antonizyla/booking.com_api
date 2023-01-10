import axios from "axios";
import jsdom from "jsdom";
import Express from "express";
const randomUseragent = require('random-useragent');

import { extractOccupancy, fetchData } from "../../common";

// get all rooms that are available for this property
module.exports.all = async function(req: Express.Request, res: Express.Response) {

    const name = req.query.name;
    const country = req.query.country || "en";
    const lang = req.query.lang || "en";

    // need to fetch with a date from past so it gives a basic list table
    let url = `https://www.booking.com/hotel/${country}/${name}.${lang}.html?checkin=2021-05-02;checkout=2021-05-06;dest_id=-512768;dest_type=city;dist=0;group_adults=1;group_children=0;hapos=1;hpos=1;no_rooms=1;req_adults=1;req_children=0;room1=A;sb_price_type=total;soh=1;sr_order=popularity;type=total;ucfs=1&#no_availability_msg`;

    const headers = {
        "Accept-Language": `${lang},en;q=0.9`,
    }

    const page = await fetchData(url, headers, Boolean(req.query.debug));

    if (page.content == null) {
        return 0;
    }

    const dom = page.content;

    type room = {
        name: string,
        internalRef: string,
        occupancy: number,
    }

    let rows = dom.window.document.querySelectorAll("div.cdefac0453");
    let rooms: room[] = [];
    for (let i = 0; i < rows.length; i++) {
        const room = new jsdom.JSDOM(rows[i].innerHTML);
        const roomName = (room.window.document.querySelectorAll("span")[0].innerHTML);
        const roomId = (room.window.document.querySelectorAll("a")[0].getAttribute("href"));
        const occupancy = extractOccupancy(room.window.document.querySelectorAll("div.ace2775fec")[0].getAttribute("aria-label"));

        console.log(roomName, roomId, occupancy);
        if (roomName != null && roomId != null) {
            rooms.push({ name: roomName, internalRef: roomId, occupancy: occupancy });
        }
    }

    if (Boolean(req.query.debug)) {
        res.send({ rooms, debug: { fetch: page.debug, url } });
    } else {
        res.send({ rooms });
    }
}
