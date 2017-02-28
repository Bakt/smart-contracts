const ContractStore = artifacts.require("./ContractStore.sol")
const FactoryStub = artifacts.require("./FactoryStub.sol")
const ExchangeRateStub = artifacts.require("./ExchangeRateStub.sol")
const EntryQueue = artifacts.require("./EntryQueue.sol")
const MarketQueues = artifacts.require("./MarketQueues.sol")

const WEI_PER_CENT = web3.toWei(1, 'ether') / 1280 // @ rate 12.80 per ETH

module.exports = function(deployer) {
    deployer.deploy(EntryQueue)
    deployer.link(EntryQueue, MarketQueues)

    deployer.deploy(ContractStore).then(() => {
        return deployer.deploy(FactoryStub)
    }).then(() => {
        return deployer.deploy(ExchangeRateStub, WEI_PER_CENT)
    }).then(() => {
        return deployer.deploy(
            MarketQueues,
            ContractStore.address,
            FactoryStub.address,
            ExchangeRateStub.address)
    }).then(() => {
        return MarketQueues.deployed()
    }).then((market) => {
        return market.addMarket("EtherUSD")
    }).catch((err) => {
        console.log(`ERROR: ${err}`)
    })
}
