var co = require('co');
require('mocha-generators').install();

var { fetchEvent } = require('./helpers');

var WithdrawalReserves = artifacts.require('WithdrawalReserves.sol');


contract("WithdrawalReserves", function(accounts) {
  var reserves;

  var systemAddress = accounts[0];
  var participantAddress = accounts[1];

  const reservedAmount = web3.toBigNumber(web3.toWei('0.1', 'ether'));

  let reserve = co.wrap(function* (participant, amount) {
    return yield reserves.reserve(
      participant, {from: systemAddress, value: amount}
    );
  });

  before(function *() {
    reserves = yield WithdrawalReserves.deployed();
  });

  it("should accept reservations", function* () {
    let result = yield reserve(participantAddress, reservedAmount);

    let log = result.logs[0];
    assert.equal(log.event, "Reserve");
    assert.equal(log.args['participant'], participantAddress);
    assert.equal(log.args['amount'].toString(), reservedAmount.toString());

    let balance = yield reserves.balances(participantAddress);
    assert.equal(balance.toString(), reservedAmount.toString()); // no prior amt
  });

  it("should allow withdrawals", function* () {
    yield reserve(participantAddress, reservedAmount);

    let balanceBefore = yield reserves.balances(participantAddress);

    let result = yield reserves.withdraw({from: participantAddress});
    let log = result.logs[0];
    assert.equal(log.event, "Withdraw");
    assert.equal(log.args['participant'], participantAddress);
    assert.equal(log.args['amount'].toString(), balanceBefore.toString());

    let balanceAfter = yield reserves.balances(participantAddress);
    assert.equal(balanceAfter.toString(), "0"); // gone
  });
});
