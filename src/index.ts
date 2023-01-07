import express, { Application } from "express";

const app: Application = express();
const port = process.env.PORT || 8080;

app.use(express.json());

let allRooms = require("./controllers/rooms/all");
app.get("/rooms/all", allRooms.all);

let prices = require("./controllers/rooms/prices");
app.get("/rooms/prices", prices.prices);

// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
