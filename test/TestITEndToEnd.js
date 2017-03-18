'use strict'

require('mocha-generators').install();

const BigNumber = require('bignumber.js')

const DollarToken = artifacts.require("./DollarToken.sol")
const ExchangeRate = artifacts.require("./ExchangeRate.sol")
const Queue = artifacts.require("./Queue.sol")
const ContractStore = artifacts.require("./ContractStore.sol")
const WithdrawalReserves = artifacts.require("./WithdrawalReserves.sol")
const BackedValueContract = artifacts.require("./BackedValueContract.sol")

const GAS_PRICE = 100000000000 // truffle / testrpc fixed gas price
const ETH_PRICE = 12.80
const WEI_PER_DOLLAR = web3.toWei(new BigNumber(1), 'ether').dividedBy(ETH_PRICE)
const ONE_DOLLAR = WEI_PER_DOLLAR

const { cents } = require('./helpers')
const bal = (addr) => { return web3.eth.getBalance(addr).toNumber() }
const balBigNumber = (addr) => { return web3.eth.getBalance(addr) }
const gas = (receipt) => { return receipt.gasUsed * GAS_PRICE }

contract('Integration Test - End to End', (accounts) => {

    const PARTY1 = accounts[5], PARTY2 = accounts[6]
    const MATCHER_ACCOUNT = accounts[0]

    it("should handle on full cycle", function* () {
        const dt = yield DollarToken.deployed();
        const exchangeRate = yield ExchangeRate.deployed();
        yield exchangeRate.receiveExchangeRate(cents(1000), {from: MATCHER_ACCOUNT})

        const queue = yield Queue.deployed();
        const entries = yield createEntries(queue)
        const eEntry = entries[0]
        const bEntry = entries[1]

        /*
         *  Emit contract for the 2 entries
         *  call from the Matcher account
         */
        const ecResult = yield dt.emitContract(eEntry, bEntry, {from: MATCHER_ACCOUNT})
        const args = ecResult.logs[0].args
        const newAddr = args.newContract
        assert.isTrue(web3.isAddress(newAddr))

        // const bvc = yield BackedValueContract.at(newAddr)
        // assert.equal(bvc.beneficiary.call(), PARTY1)
        // assert.equal(bvc.emitter.call(), PARTY2)
        // assert.equal(bvc.notionalCents.call(), 12)
        // assert.equal(bvc.pendingNotionalCents.call(), 112)

        // const notionalDollars = 2
        // assert.equal(args.notionalValue, notionalDollars * weiPerDollar,
        //         "expect to be 2 dollars - lowest amount rounded down to even dollar")
        // assert.equal(bal(dt.address), 0,
        //         "dts contract emptied out")
        // assert.equal(bal(newAddr), notionalDollars * 2 * weiPerDollar,
        //         "4 dollars expected - 2 dollars each")
        //
        // // use BigNumber to handle large balance and avoid float precision issues
        // const expectedBal = (balBefore, entryDollars, contractDollars) => {
        //     return new BigNumber(entryDollars).minus(2).times(weiPerDollar).plus(balBefore)
        // }
        // assert(balBigNumber(PARTY1).eq(
        //         expectedBal(balP1Before, DOLLAR_P1, notionalDollars)),
        //         "expect refund difference from 2 dollars")
        // assert(balBigNumber(PARTY2).eq(
        //         expectedBal(balP2Before, DOLLAR_P2, notionalDollars)),
        //         "expect refund difference from 2 dollars")

        /*
         * Check new contract was posted to the store
         */
        const store = yield ContractStore.deployed()
        assert((yield store.exists.call(newAddr)) === true)
        assert((yield store.isOpen.call(newAddr)) === true)

        /*
         *  check entries removed and set to filled
         */
        assert.equal((yield queue.lengthEmitter.call()).toNumber(), 0)
        assert.equal((yield queue.lengthBeneficiary.call()).toNumber(), 0)
        assert((yield queue.getEntryEmitter.call(eEntry))[2])
        assert((yield queue.getEntryBeneficiary.call(bEntry))[2])

        /*
         *  check balances
         */
        const reserves = yield WithdrawalReserves.deployed();

        // TODO: how to get done with the generator style function?? :
        // done()
    })

    function createEntries(queue) {
        return Promise.all([
            queue.emitterChannel.call(),
            queue.beneficiaryChannel.call()
        ]).then((channels) => {
            const [eChannel, bChannel] = channels
            return Promise.all([
                web3.eth.sendTransaction({
                     from: PARTY1,
                     to: bChannel,
                     value: ONE_DOLLAR,
                     gas: 500000
                }),
                web3.eth.sendTransaction({
                     from: PARTY2,
                     to: eChannel,
                     value: ONE_DOLLAR,
                     gas: 500000
                })
            ])
        }).then((res) => {
            return Promise.all([
                queue.getOpenEmitter.call(),
                queue.getOpenBeneficiary.call()
            ])
        }).then((result) => {
            return [result[0][0], result[1][0]]
        }).catch((err) => {
            console.error(err);
        })
    }

})
