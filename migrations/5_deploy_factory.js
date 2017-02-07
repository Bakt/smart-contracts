const { deployService } = require('../lib/deployment');
const Factory = artifacts.require("Factory.sol");

module.exports = function(deployer) {
    return deployer.then(function () {
        return deployService(web3, deployer, artifacts, Factory);
    });
};
