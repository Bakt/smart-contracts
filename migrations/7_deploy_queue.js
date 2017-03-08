const { asyncDeploy, deployService } = require('../lib/deployment');

const DollarToken = artifacts.require("./DollarToken.sol")
const EntryQueueLib = artifacts.require("./EntryQueueLib.sol")
const Queue = artifacts.require("./Queue.sol")

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.deploy(EntryQueueLib)
    yield deployer.link(EntryQueueLib, Queue)
    yield deployService(web3, deployer, artifacts, Queue)

    const dollarToken = yield DollarToken.deployed()
    return yield dollarToken.setQueue(Queue.address)
})
