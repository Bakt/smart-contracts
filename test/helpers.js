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
    return web3.toBigNumber((c * 10 ** 18) / 100)
}

module.exports = {
    fetchEvent, cents
};
