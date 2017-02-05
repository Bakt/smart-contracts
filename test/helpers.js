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

module.exports = {
    fetchEvent
};
