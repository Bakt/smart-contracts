let ExchangeRate = artifacts.require("ExchangeRate.sol");

let { asyncDeploy, deployService } = require('../lib/deployment');

let DEV_RATE_CENTS = 100

module.exports = asyncDeploy(function *(deployer, network) {
    let exRate = yield deployService(web3, deployer, artifacts, ExchangeRate);
    if (network === 'development') { // inject a rate for dev so don't need to do it manually
        yield exRate.receiveExchangeRate(DEV_RATE_CENTS)
    }
    return exRate
});
