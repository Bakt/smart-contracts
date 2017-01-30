require('mocha-generators').install();

var { fetchEvent } = require('./helpers');

contract('ExchangeRate', function(accounts) {
    it("should allow triggering price fetch", function* () {
        var exchangeRate = ExchangeRate.deployed();

        yield exchangeRate.deposit.sendTransaction(
            {value: web3.toBigNumber('6000000000000000'), from: accounts[0]}
        );

        yield exchangeRate.initFetch.sendTransaction({
            from: accounts[0]
        });

        var log = yield fetchEvent(exchangeRate.allEvents());
        console.log(log.args.exchangeRate.toString());
        assert.equal(log.event, "UpdateExchangeRate");
    });
});
