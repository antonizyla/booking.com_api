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


export { dateToString, extractOccupancy };
