const { asyncDeploy, deployService } = require('../lib/deployment');

const DollarToken = artifacts.require("./DollarToken.sol")
const WithdrawalsReserves = artifacts.require("./WithdrawalsReserves.sol")
const SafeSendLib = artifacts.require("SafeSendLib.sol");
const MathLib = artifacts.require("MathLib.sol");

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.link(MathLib, WithdrawalsReserves);
    yield deployer.link(SafeSendLib, WithdrawalsReserves);
    return yield deployService(web3, deployer, artifacts, WithdrawalsReserves);
})
