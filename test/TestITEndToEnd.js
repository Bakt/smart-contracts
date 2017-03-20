'use strict'

/**
 * Integration test that tests the full flow from sending ether to having the
 * contract drawn up checking balances and state values along the way.
 */

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
        yield exchangeRate.receiveExchangeRate(cents(ETH_PRICE * 100), {from: MATCHER_ACCOUNT})

        const queue = yield Queue.deployed();
        const entries = yield createEntries(queue)
        const eEntry = entries[0]
        const bEntry = entries[1]

        const reserves = yield WithdrawalReserves.deployed();
        assert.equal((yield reserves.balances.call(PARTY1)).toNumber(), ONE_DOLLAR)
        assert.equal((yield reserves.balances.call(PARTY2)).toNumber(), ONE_DOLLAR)

        /*
         *  Emit contract for the 2 entries
         *  call from the Matcher account
         */
        const ecResult = yield dt.emitContract(eEntry, bEntry, {from: MATCHER_ACCOUNT})
        const args = ecResult.logs[0].args
        const newAddr = args.newContract
        assert.isTrue(web3.isAddress(newAddr))

        /*
         *  Check the contract details
         */
        const bvc = yield BackedValueContract.at(newAddr)
        assert.equal(yield bvc.beneficiary.call(), PARTY1)
        assert.equal(yield bvc.emitter.call(), PARTY2)
        assert.equal((yield bvc.notionalCents.call()).toNumber(), 100)
        assert.equal((yield bvc.pendingNotionalCents.call()).toNumber(), 0)

        /*
         * Check new contract was posted to the store
         */
        const store = yield ContractStore.deployed()
        assert((yield store.exists.call(newAddr)) === true)
        assert((yield store.isOpen.call(newAddr)) === true)

        /*
         *  check balances
         */
        assert.equal(web3.eth.getBalance(newAddr).toNumber(), ONE_DOLLAR * 2)
        assert.equal((yield reserves.balances.call(PARTY1)).toNumber(), 0)
        assert.equal((yield reserves.balances.call(PARTY2)).toNumber(), 0)

        /*
         *  check entries removed and set to filled
         */
        assert.equal((yield queue.lengthEmitter.call()).toNumber(), 0)
        assert.equal((yield queue.lengthBeneficiary.call()).toNumber(), 0)
        assert((yield queue.getEntryEmitter.call(eEntry))[2])
        assert((yield queue.getEntryBeneficiary.call(bEntry))[2])

        /*
         * TODO: take further and have one party withdraw from the contract
         */
        
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
