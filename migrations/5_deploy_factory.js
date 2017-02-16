const { asyncDeploy, deployService } = require('../lib/deployment');
const Factory = artifacts.require("Factory.sol");
const BackedValueContract = artifacts.require("BackedValueContract.sol");
const SafeSendLib = artifacts.require("SafeSendLib.sol");
const MathLib = artifacts.require("MathLib.sol");

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.link(MathLib, BackedValueContract);
    yield deployer.link(SafeSendLib, BackedValueContract);
    yield deployer.link(MathLib, Factory);
    yield deployer.link(SafeSendLib, Factory);

    return yield deployService(web3, deployer, artifacts, Factory);
});
