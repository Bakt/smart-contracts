let Factory = artifacts.require("Factory.sol");

let { deployService } = require('../lib/deployment');

module.exports = function(deployer) {
    return deployService(web3, deployer, artifacts, Factory);
};
