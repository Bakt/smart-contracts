'use strict'

require('mocha-generators').install();

const BigNumber = require('bignumber.js')

const DollarToken = artifacts.require("./DollarToken.sol")
const ExchangeRate = artifacts.require("./ExchangeRate.sol")
const Queue = artifacts.require("./Queue.sol")
const ContractStore = artifacts.require("./ContractStore.sol")
const WithdrawalsReserves = artifacts.require("./WithdrawalsReserves.sol")

const GAS_PRICE = 100000000000 // truffle / testrpc fixed gas price
const ETH_PRICE = 12.80
const WEI_PER_DOLLAR = web3.toWei(new BigNumber(1), 'ether').dividedBy(ETH_PRICE)
const ONE_DOLLAR = WEI_PER_DOLLAR

const { cents } = require('./helpers')
const bal = (addr) => { return web3.eth.getBalance(addr).toNumber() }
const balBigNumber = (addr) => { return web3.eth.getBalance(addr) }
const gas = (receipt) => { return receipt.gasUsed * GAS_PRICE }

contract('DollarToken', (accounts) => {

    const PARTY1 = accounts[5], PARTY2 = accounts[6]
    const MATCHER_ACCOUNT = accounts[0]

    it("should handle full life cycle", (done) => {
        let newAddr
        let eEntry, bEntry
        let dt, queue, exchangeRate

        DollarToken.deployed().then((c) => {
            dt = c
            return ExchangeRate.deployed()
        }).then((c) => {
            exchangeRate = c
            return exchangeRate.receiveExchangeRate(
                cents(1000), {from: MATCHER_ACCOUNT}
            );
        }).then(() => {
            return Queue.deployed()
        }).then((c) => {
            queue = c
            return createEntries(queue)
        }).then((entries) => {
            eEntry = entries[0]
            bEntry = entries[1]
            // [eEntry, bEntry] = entries
        }).then((result) => {
            /*
             *  Emit contract for the 2 entries
             *  call from the Matcher account
             */
            return dt.emitContract(eEntry, bEntry, {from: MATCHER_ACCOUNT})
        }).then((result) => {

            /*
             *  check new contract and all balances
             */
            const args = result.logs[0].args
            newAddr = args.newContract
            assert.isTrue(web3.isAddress(newAddr))

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
            return ContractStore.deployed()
        }).then((store) => {
            return Promise.all([
                store.exists.call(newAddr),
                store.isOpen.call(newAddr)
            ])
        }).then((results) => {
            assert(results[0] === true)
            assert(results[1] === true)

            /*
             *  check entries removed and set to filled
             */
            return queue.lengthEmitter.call()
        }).then((count) => {
            assert.equal(count.toNumber(), 0)
            return queue.lengthBeneficiary.call()
        }).then((count) => {
            assert.equal(count.toNumber(), 0)
            return queue.getEntryEmitter.call(eEntry)
        }).then((result) => {
            assert(result[2])  // filled
            return queue.getEntryBeneficiary.call(bEntry)
        }).then((result) => {
            assert(result[2])  // filled

            done()
        })
    })

    it("should update matcher address sender is owner", (done) => {
        const newMatcher = accounts[9]
        DollarToken.deployed().then((dt) => {
            dt.matcher.call().then((matcher) => {
                assert.equal(matcher, accounts[0])
                return dt.setMatcher(newMatcher)
            }).then(() => {
                return dt.matcher.call()
            }).then((matcher) => {
                assert.equal(matcher, newMatcher)
                done()
            })
        })
    })

    it("should fail update matcher address if sender not owner", (done) => {
        const newMatcher = accounts[9]
        DollarToken.deployed().then((dt) => {
            return dt.setMatcher(newMatcher, {from: accounts[2]})
        }).then(() => {
            assert.fail("Should have thrown an exception")
        }).catch((err) => {
            assert.include(err.message, "invalid JUMP")
            done()
        })
    })

    it("should allow value reservations for a participant", function* () {
      let dollarToken = yield DollarToken.deployed();
      let reservedAmount = web3.toBigNumber(web3.toWei('0.1', 'ether'));
      let reserves = yield WithdrawalsReserves.deployed();

      let originalBalance = yield reserves.balances(PARTY1);
      let expectedBalance = originalBalance.plus(reservedAmount);

      let result = yield dollarToken.reserveFor(PARTY1, {value: reservedAmount});

      let actualBalance = yield reserves.balances(PARTY1);
      assert.equal(actualBalance.toString(), expectedBalance.toString());
    });

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
                     gas: 200000
                }),
                web3.eth.sendTransaction({
                     from: PARTY2,
                     to: eChannel,
                     value: ONE_DOLLAR,
                     gas: 200000
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
