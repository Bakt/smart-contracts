const BigNumber = require('bignumber.js')

const DollarToken = artifacts.require("./DollarToken.sol")
const Queue = artifacts.require("./Queue.sol")
const ContractStore = artifacts.require("./ContractStore.sol")
const ExchangeRateStub = artifacts.require("./ExchangeRateStub.sol")

const GAS_PRICE = 100000000000 // truffle / testrpc fixed gas price
const NAME      = "EtherUSD"

const bal = (addr) => { return web3.eth.getBalance(addr).toNumber() }
const balBigNumber = (addr) => { return web3.eth.getBalance(addr) }
const gas = (receipt) => { return receipt.gasUsed * GAS_PRICE }

contract('DollarToken', (accounts) => {

    const PARTY1 = accounts[5], PARTY2 = accounts[6];

    it.skip("should handle full life cycle", (done) => {
        const DOLLAR_P1 = 2.5
        const DOLLAR_P2 = 3.1

        let weiPerCent, weiPerDollar, weiP1, weiP2
        let newAddr
        let eChannel, eEntry
        let dChannel, dEntry
        let balP1Before, balP2Before

        DollarToken.deployed().then((c) => {
            dt = c
            return ExchangeRateStub.deployed()
        }).then((exRate) => {
            return exRate.weiPerCent.call()
        }).then((wei) => {
            weiPerCent = wei
            weiPerDollar = weiPerCent * 100
            // console.log(`Exchange Rate(per USD cent): ${weiPerCent}`)
            return Promise.all([
                dt.getOpenDollar.call(matcher),
                dt.getOpenEtherGuy.call(matcher)
            ])
        }).then((idLists) => {
            assert.equal(idLists[0].length, 0)
            assert.equal(idLists[1].length, 0)

            /*
             *  Send ETH to each channel to open 1 entry on each market dt
             */
            weiP1 = weiPerDollar * DOLLAR_P1
            weiP2 = weiPerDollar * DOLLAR_P2
            return Promise.all([
                web3.eth.sendTransaction({
                     from: PARTY1,
                     to: dChannel,
                     value: weiP1,
                     gas: 200000
                }),
                web3.eth.sendTransaction({
                     from: PARTY2,
                     to: eChannel,
                     value: weiP2,
                     gas: 200000
                })
            ])
        }).then((result) => {
            assert.equal(bal(dt.address), weiP1 + weiP2)
            assert.equal(bal(dChannel), 0)
            assert.equal(bal(eChannel), 0)

            return dt.getOpenDollar.call(matcher)
        }).then((entryIds) => {
            assert.equal(entryIds.length, 1)
            dEntry = entryIds[0]
        }).then(() => {
            return dt.getOpenEtherGuy.call(matcher)
        }).then((entryIds) => {
            assert.equal(entryIds.length, 1)
            eEntry = entryIds[0]

            /*
             *  Get and check all entry details
             */
            return dt.getEntryDollar.call(matcher, dEntry)
        }).then((result) => {
            assert.equal(result[0], PARTY1)
            assert.equal(result[1], weiP1)
            assert.isFalse(result[2])
            return dt.getEntryEtherGuy.call(matcher, eEntry)
        }).then((result) => {
            assert.equal(result[0], PARTY2)
            assert.equal(result[1], weiP2)
            assert.isFalse(result[2])

            /*
             *  drawContract for the 2 matching entries
             */
             balP1Before = balBigNumber(PARTY1)
             balP2Before = balBigNumber(PARTY2)
            return dt.drawContract(matcher, eEntry, dEntry)
        }).then((result) => {

            /*
             *  check new contract and all balances
             */
            const args = result.logs[0].args
            newAddr = args.newContract
            assert.isTrue(web3.isAddress(newAddr))

            const notionalDollars = 2
            assert.equal(args.notionalValue, notionalDollars * weiPerDollar,
                    "expect to be 2 dollars - lowest amount rounded down to even dollar")
            assert.equal(bal(dt.address), 0,
                    "dts contract emptied out")
            assert.equal(bal(newAddr), notionalDollars * 2 * weiPerDollar,
                    "4 dollars expected - 2 dollars each")

            // use BigNumber to handle large balance and avoid float precision issues
            const expectedBal = (balBefore, entryDollars, contractDollars) => {
                return new BigNumber(entryDollars).minus(2).times(weiPerDollar).plus(balBefore)
            }
            assert(balBigNumber(PARTY1).eq(
                    expectedBal(balP1Before, DOLLAR_P1, notionalDollars)),
                    "expect refund difference from 2 dollars")
            assert(balBigNumber(PARTY2).eq(
                    expectedBal(balP2Before, DOLLAR_P2, notionalDollars)),
                    "expect refund difference from 2 dollars")

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
            return dt.lengthEtherGuy.call(matcher)
        }).then((count) => {
            assert.equal(count.toNumber(), 0)
            return dt.lengthDollar.call(matcher)
        }).then((count) => {
            assert.equal(count.toNumber(), 0)
            return dt.getEntryEtherGuy.call(matcher, eEntry)
        }).then((result) => {
            assert(result[2])  // filled
            return dt.getEntryDollar.call(matcher, dEntry)
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

})
