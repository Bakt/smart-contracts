const { asyncDeploy, deployService } = require('../lib/deployment');

const DollarToken = artifacts.require("./DollarToken.sol")
const WithdrawalReserves = artifacts.require("./WithdrawalReserves.sol")
const SafeSendLib = artifacts.require("SafeSendLib.sol");
const MathLib = artifacts.require("MathLib.sol");

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.link(MathLib, WithdrawalReserves);
    yield deployer.link(SafeSendLib, WithdrawalReserves);
    return yield deployService(web3, deployer, artifacts, WithdrawalReserves);
})
