const { asyncDeploy, deployService } = require('../lib/deployment');
const Factory = artifacts.require("Factory.sol");

module.exports = asyncDeploy(function *(deployer) {
    return yield deployService(web3, deployer, artifacts,Factory);
});
