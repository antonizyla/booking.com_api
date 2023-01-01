import express, {Application, response} from "express";

const axios = require("axios")
const jsdom = require("jsdom");
const randomUseragent = require('random-useragent');
const {removeAttributeByName} = require("jsdom/lib/jsdom/living/attributes");


const app: Application = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// define a route handler for the default home page
app.get("/", (req, res) => {
    res.send("Hello worsld");
});

app.get("/rooms", async (req, res) => {
    // expects query param of name as in booking url
    if (!req.query.name) {
        res.status(400).send("Missing name query param");
        return;
    }
    const name = req.query.name;
    const country = req.query.country || "en";
    const lang = req.query.lang || "en";

    // need to fetch with a date from past so it gives a basic list table
    let url = `https://www.booking.com/hotel/${country}/${name}.${lang}.html?checkin=2021-05-02;checkout=2021-05-06;dest_id=-512768;dest_type=city;dist=0;group_adults=1;group_children=0;hapos=1;hpos=1;no_rooms=1;req_adults=1;req_children=0;room1=A;sb_price_type=total;soh=1;sr_order=popularity;type=total;ucfs=1&#no_availability_msg`;

    const headers = {
        "User-Agent": randomUseragent.getRandom(),
        "DNT": "1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Language": "en-GB,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
    }

    const booking = await axios.get(url, {headers}).then((response: any) => {
        return response
    }).catch((err: any) => {
        res.send({message: err.message, name: err.name});
        return;
    });

    if (booking == undefined) {
        return 0;
    }

    const dom = new jsdom.JSDOM(booking.data);

    let rooms: string[] = [];
    let divs = dom.window.document.querySelectorAll("a.js-legacy-room-name")
    divs.forEach((div: any) => {
        const room = new jsdom.JSDOM(div.innerHTML);
        rooms.push(room.window.document.getElementsByTagName("span")[0].innerHTML);
    });

    res.send({rooms, url});
});

// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});