const DollarToken = artifacts.require("./DollarToken.sol")
const ContractStore = artifacts.require("./ContractStore.sol")
const FactoryStub = artifacts.require("./FactoryStub.sol")
const ExchangeRateStub = artifacts.require("./ExchangeRateStub.sol")
const EntryQueueLib = artifacts.require("./EntryQueueLib.sol")
const Queue = artifacts.require("./Queue.sol")

const WEI_PER_CENT = web3.toWei(1, 'ether') / 1280 // @ rate 12.80 per ETH
const MATCHER_ACCOUNT = web3.eth.accounts[0]

module.exports = function(deployer) {
    deployer.deploy(EntryQueueLib)
    deployer.link(EntryQueueLib, Queue)

    deployer.deploy(ContractStore).then(() => {
        return deployer.deploy(Queue)
    }).then(() => {
        return deployer.deploy(FactoryStub)
    }).then(() => {
        return deployer.deploy(ExchangeRateStub, WEI_PER_CENT)
    }).then(() => {
        return Queue.deployed()
    }).then((queue) => {
        deployer.deploy(
            DollarToken,
            ContractStore.address,
            FactoryStub.address,
            ExchangeRateStub.address,
            queue.address,
            MATCHER_ACCOUNT
        ).then(() => {
            return queue.setDollarToken(DollarToken.address)
        }).catch((err) => {
            console.log(`ERROR: ${err}`)
        })
    }).catch((err) => {
        console.log(`ERROR: ${err}`)
    })
}
