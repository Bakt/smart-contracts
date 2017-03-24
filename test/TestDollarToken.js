'use strict'

require('mocha-generators').install();

const DollarToken = artifacts.require("./DollarToken.sol")
const WithdrawalReserves = artifacts.require("./WithdrawalReserves.sol")

contract('DollarToken', (accounts) => {

    const PARTY1 = accounts[5], PARTY2 = accounts[6]
    const MATCHER_ACCOUNT = accounts[0]

    it("should update matcher address sender is owner", (done) => {
        const newMatcher = accounts[9]
        DollarToken.deployed().then((dt) => {
            dt.matcher.call().then((matcher) => {
                assert.equal(matcher, MATCHER_ACCOUNT)
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
      let reserves = yield WithdrawalReserves.deployed();

      let originalBalance = yield reserves.balances(PARTY1);
      let expectedBalance = originalBalance.plus(reservedAmount);

      let result = yield dollarToken.reserveFor(PARTY1, {value: reservedAmount});

      let actualBalance = yield reserves.balances(PARTY1);
      assert.equal(actualBalance.toString(), expectedBalance.toString());
    });

})
