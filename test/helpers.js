function fetchEvent(events) {
    return new Promise((resolve, reject) => {
        events.watch((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

function cents(c) {
    return web3.toBigNumber(c);
}

module.exports = {
    fetchEvent, cents
};
