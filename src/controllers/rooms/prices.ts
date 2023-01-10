import axios from "axios";
import Express from "express";
import jsdom from "jsdom";
const randomUseragent = require("random-useragent");

import { dateToString, extractOccupancy, fetchData } from "../../common";

module.exports.prices = async function(req: Express.Request, res: Express.Response) {
    const reqRooms: string[] = req.body.rooms || ["all"];

    if (!req.query.name) {
        res.status(400).send("Missing name query param");
        return;
    }
    const name = req.query.name;
    const country = req.query.country || "en";
    const lang = req.query.lang || "en";
    const checkin = req.query.checkin || dateToString(new Date());
    const dateCheckin = new Date(String(req.query.checkin)) || new Date();
    const checkout = req.query.checkout || dateToString(new Date(dateCheckin.getTime() + 24 * 60 * 60 * 1000));

    // need to fetch with a date from past so it gives a basic list table
    let url = `https://www.booking.com/hotel/${country}/${name}.${lang}.html?checkin=${checkin};checkout=${checkout};group_adults=1;group_children=0;hapos=1;hpos=1;no_rooms=1;req_adults=1;req_children=0;room1=A;sb_price_type=total;soh=1`;

    const headers = {
        "Accept-Language": `${lang};q=0.9`,
    }

    const page = await fetchData(url, headers, Boolean(req.query.debug));

    if (page.content == undefined) {
        return;
    }

    const dom = page.content;
    const rows = dom.window.document.getElementsByTagName("tbody")[0].querySelectorAll("tr.e2e-hprt-table-row");

    type room = {
        name: string,
        price: string,
        occupancy: number,
    }

    let rooms: room[] = [];

    let prevRoom = "";
    for (let i = 0; i < rows.length; i++) {
        const roomRow = new jsdom.JSDOM(rows[i].innerHTML);

        let roomName = roomRow.window.document.getElementsByTagName("span")[0].innerHTML;
        roomName = roomName.replace(/(\r\n|\n|\r)/gm, "");

        let price = roomRow.window.document.querySelectorAll("span.prco-valign-middle-helper")[0].innerHTML;
        price = price.replace(/(\r\n|\n|\r)/gm, "");
        price = price.replace("&nbsp;", " ")

        let occupancy = extractOccupancy(roomRow.window.document.querySelectorAll("span.bui-u-sr-only")[0].innerHTML);

        let room: room;

        if (roomName[0] != "<") {
            prevRoom = roomName;
        }
        room = { name: prevRoom, price, occupancy: occupancy };

        rooms.push(room);
    }

    let response = {};
    if (reqRooms[0] === "all") {
        // select all rooms
        response = { rooms };
    } else {
        // select all rooms that match
        response = { rooms: rooms.filter(room => reqRooms.includes(room.name)), url };
    }

    if (Boolean(req.query.debug)) {
        Object.assign(response, { debug: { fetch: page.debug, url } })
    }

    res.send(response);
}
