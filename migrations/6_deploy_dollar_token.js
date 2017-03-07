const { asyncDeploy, deployService } = require('../lib/deployment');

const DollarToken = artifacts.require("./DollarToken.sol")
const ContractStore = artifacts.require("./ContractStore.sol")

const MATCHER_ACCOUNT = web3.eth.accounts[0]

module.exports = asyncDeploy(function *(deployer) {
    yield deployService(web3, deployer, artifacts, ContractStore)
    yield deployService(web3, deployer, artifacts, DollarToken)
    const dollarToken = yield DollarToken.deployed()
    return yield dollarToken.setMatcher(MATCHER_ACCOUNT)
})
