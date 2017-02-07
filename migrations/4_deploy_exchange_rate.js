let ExchangeRate = artifacts.require("ExchangeRate.sol");

let { deployService } = require('../lib/deployment');

module.exports = function(deployer) {
    return deployer.then(function() {
        return deployService(web3, deployer, artifacts, ExchangeRate);
    });
};
