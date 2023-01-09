import jsdom from "jsdom";
import axios from "axios";
const randomUserAgent = require("random-useragent");

function dateToString(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function extractOccupancy(occupancyStr: string | null): number {
    if (occupancyStr === null) {
        return -1;
    }
    const numRe = new RegExp("[0-9]+", "g");
    let nums = occupancyStr.match(numRe);

    if (nums === null) {
        return -1;
    }

    if (nums.length === 1) {
        return Number(nums[0]);
    } else {
        return Math.max(Number(nums[0]), Number(nums[1]));
    }
}


function toDecimalSep(str: string): string {
    return str.replace(",", ".");
}

async function fetchData(url: string, headers: object, debug: boolean = false) {
    console.log("Fetching data from: " + url);
    const userAgent = randomUserAgent.getRandom();
    let defaultHeaders = {
        "User-Agent": userAgent,
        "DNT": "1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Language": `en;q=0.9`,
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
    }
    Object.assign(defaultHeaders, headers);

    const startTime = new Date();

    let error;
    const page = await axios.get(url, { headers }).then((response) => {
        return response;
    }).catch((error) => {
        error = { error: error.message, name: error.name };
    });

    const timeAfterReq = new Date();

    const debugVals = {
        headers: defaultHeaders,
        externalFetchTimeMS: timeAfterReq.getTime() - startTime.getTime(),
        status: error ? "Error" : "Success",
    }

    if (page != undefined) {
        const timeBeforeParse = new Date();
        let content = new jsdom.JSDOM(page.data);
        const timeAfterParse = new Date();
        Object.assign(debugVals, { parseTimeMs: timeAfterParse.getTime() - timeBeforeParse.getTime() });

        let response = { content, status: (error ? "Error" : "Success") };
        if (debug){
            Object.assign(response, { debug: debugVals });
        }
        return response;
    } else {
        let response = { content: null, error, status: (error ? "Error" : "Success") };
        if (debug){
            Object.assign(response, { debug: debugVals });
        }
        return response;
    }
}


export { dateToString, extractOccupancy, toDecimalSep, fetchData };
