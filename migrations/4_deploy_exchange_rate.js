let ExchangeRate = artifacts.require("ExchangeRate.sol");

let { asyncDeploy, deployService } = require('../lib/deployment');

module.exports = asyncDeploy(function *(deployer) {
    return yield deployService(web3, deployer, artifacts, ExchangeRate);
});
