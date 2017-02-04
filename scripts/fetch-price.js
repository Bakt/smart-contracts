var ExchangeRate = artifacts.require("ExchangeRate.sol");

var { fetchEvent } = require('../test/helpers.js');

module.exports = function(callback) {
    ExchangeRate.deployed().then(function(exchangeRate) {
        exchangeRate.initFetch().then(function(result) {
            console.log(result);

            fetchEvent(
                exchangeRate.UpdateExchangeRate()
            ).then(function (log) {
                console.log(log.args.exchangeRate.toString());
            });
        });
    });
}

