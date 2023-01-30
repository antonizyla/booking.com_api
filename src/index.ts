import express, { Application } from "express";

import redis from "redis";
let redisClient: any;
(async () => {
    redisClient = redis.createClient();

    redisClient.on("error", () => { console.log('error') });

    await redisClient.connect();
});

const app: Application = express();
const port = process.env.PORT || 8080;

function midWare(req: any, res: any, next: any) {
    const { username } = req.params;
    redisClient.get(username, (error: any, cachedData: any) => {
        if (error) throw error;
        if (cachedData != null) {
            res.send(res.setResponse(username, cachedData));
        } else {
            next();
        }
    });
}
//app.use(express.json());

let allRooms = require("./controllers/rooms/allRooms");
app.get("/rooms/all", midWare, allRooms.all);

let prices = require("./controllers/rooms/prices");
app.get("/rooms/prices", midWare, prices.prices);

let info = require("./controllers/hotels/info");
app.get("/hotels/info", midWare, info.info);

let search = require("./controllers/hotels/search");
app.get("/hotels/search", search.search);

// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
