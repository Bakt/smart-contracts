const ContractStore = artifacts.require("./ContractStore.sol")
const FactoryStub = artifacts.require("./FactoryStub.sol")
const ExchangeRateStub = artifacts.require("./ExchangeRateStub.sol")
const EntryQueueLib = artifacts.require("./EntryQueueLib.sol")
const Queue = artifacts.require("./Queue.sol")

const WEI_PER_CENT = web3.toWei(1, 'ether') / 1280 // @ rate 12.80 per ETH

module.exports = function(deployer) {
    deployer.deploy(EntryQueueLib)
    deployer.link(EntryQueueLib, Queue)

    deployer.deploy(ContractStore).then(() => {
        return deployer.deploy(FactoryStub)
    }).then(() => {
        return deployer.deploy(ExchangeRateStub, WEI_PER_CENT)
    }).then(() => {
        return deployer.deploy(
            Queue,
            ContractStore.address,
            FactoryStub.address,
            ExchangeRateStub.address)
    }).then(() => {
        return Queue.deployed()
    }).then((market) => {
        return market.addMarket("EtherUSD")
    }).catch((err) => {
        console.log(`ERROR: ${err}`)
    })
}
