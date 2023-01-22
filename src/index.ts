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

var midWare = (req: any, res: any, next: any) => {
    const key = req.url
    redisClient.get(key, (err: any, result: any) => {
        if (err == null && result != null) {
            res.send('from cache')
        } else {
            res.sendResponse = res.send
            res.send = (body: any) => {
                redisClient.set(key, body, (err:any, reply: any) => {
                    if (reply == 'OK')
                        res.sendResponse(body)
                })
            }
            next()
        }
    })
}
app.use(express.json());

let allRooms = require("./controllers/rooms/allRooms");
app.get("/rooms/all", midWare, allRooms.all);

let prices = require("./controllers/rooms/prices");
app.get("/rooms/prices", midWare, prices.prices);

let info = require("./controllers/hotels/info");
app.get("/hotels/info", midWare, info.info);

// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
