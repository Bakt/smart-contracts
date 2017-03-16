const BigNumber = require('bignumber.js')
const Queue = artifacts.require("./Queue.sol")

const bal = (addr) => { return web3.eth.getBalance(addr).toNumber() }
const ETH_PRICE = 12.80
const WEI_PER_DOLLAR = web3.toWei(new BigNumber(1), 'ether').dividedBy(ETH_PRICE)

contract('Queue', (accounts) => {

    const PARTY1 = accounts[5], PARTY2 = accounts[6];

    it("should handle full life cycle", (done) => {
        const DOLLAR_P1 = 2.5
        const DOLLAR_P2 = 3.1

        let queue
        let weiP1, weiP2
        let eChannel, eEntry
        let dChannel, dEntry
        let balP1Before, balP2Before

        Queue.deployed().then((c) => {
            queue = c

            return Promise.all([
                queue.emitterChannel.call(),
                queue.beneficiaryChannel.call()
            ])
        }).then((channels) => {
            [eChannel, dChannel] = channels

            return Promise.all([
                queue.getOpenEmitter.call(),
                queue.getOpenBeneficiary.call()
            ])
        }).then((idLists) => {
            assert.equal(idLists[0].length, 0)
            assert.equal(idLists[1].length, 0)

            /*
             *  Send ETH to each channel to open 1 entry on each market queue
             */
            weiP1 = WEI_PER_DOLLAR.times(DOLLAR_P1)
            weiP2 = WEI_PER_DOLLAR.times(DOLLAR_P2)
            return Promise.all([
                web3.eth.sendTransaction({
                     from: PARTY1,
                     to: dChannel,
                     value: weiP1,
                     gas: 500000
                }),
                web3.eth.sendTransaction({
                     from: PARTY2,
                     to: eChannel,
                     value: weiP2,
                     gas: 500000
                })
            ])
        }).then((result) => {
            // check all ETH passed through
            assert.equal(bal(dChannel), 0)
            assert.equal(bal(eChannel), 0)
            return queue.getOpenBeneficiary.call()
        }).then((entryIds) => {
            assert.equal(entryIds.length, 1)
            dEntry = entryIds[0]
        }).then(() => {
            return queue.getOpenEmitter.call()
        }).then((entryIds) => {
            assert.equal(entryIds.length, 1)
            eEntry = entryIds[0]

            /*
             *  Get and check all entry details
             */
            return queue.getEntryBeneficiary.call(dEntry)
        }).then((result) => {
            assert.equal(result[0], PARTY1)
            assert(result[1].eq(weiP1))
            assert.isFalse(result[2])
            return queue.getEntryEmitter.call(eEntry)
        }).then((result) => {
            assert.equal(result[0], PARTY2)
            assert(result[1].eq(weiP2))
            assert.isFalse(result[2])

            /*
             *  Remove entries (NOTE: can only be called by DollarToken so first
             *      change DollarToken address to a local account)
             */
             return queue.setDollarToken(accounts[9])
         }).then((result) => {

            return queue.remove(eEntry, dEntry, {from:accounts[9]})
        }).then((result) => {
            assert.equal(result.logs[0].event, "EmitterRemoved")
            assert.equal(result.logs[1].event, "BeneficiaryRemoved")

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
            return queue.getEntryBeneficiary.call(dEntry)
        }).then((result) => {
            assert(result[2])  // filled

            done()
        })
    })

    it("should update DollarToken address if sender is owner", (done) => {
        const newAddr = accounts[9] // just use an account address
        Queue.deployed().then((queue) => {
            queue.setDollarToken(newAddr, {from: accounts[0]}).then(() => {
                return queue.dollarToken.call()
            }).then((dollarToken) => {
                assert.equal(dollarToken, newAddr)
                done()
            })
        })
    })

    it("should fail update DollarToken address if sender not owner", (done) => {
        const newAddr = accounts[9] // just use an account address
        Queue.deployed().then((queue) => {
            return queue.setDollarToken(newAddr, {from: accounts[2]})
        }).then(() => {
            assert.fail("Should have thrown an exception")
        }).catch((err) => {
            assert.include(err.message, "invalid JUMP")
            done()
        })
    })

})
