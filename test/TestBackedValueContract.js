require('mocha-generators').install();

var { cents, fetchEvent } = require('./helpers');

var BackedValueContract = artifacts.require('BackedValueContract.sol');
var Services = artifacts.require('Services.sol');
var ExchangeRate = artifacts.require('ExchangeRate.sol');

contract('BackedValueContract', function(accounts) {
    let emitter = accounts[0];
    let beneficiary = accounts[1];
    var services;
    var weiPerCent;

    let minimumWeiForCents = function(cents, weiPerCent) {
        let bufferMargin = 2.1;

        return cents.times(bufferMargin).times(weiPerCent)
    }

    before(function *() {
        services = yield Services.deployed();
        exchangeRate = yield ExchangeRate.deployed();

        yield exchangeRate.initFetch();
        yield fetchEvent(exchangeRate.UpdateExchangeRate("latest"));

        weiPerCent = yield exchangeRate.weiPerCent();
    });

    it("should be deployable", function* () {
        // setup
        var notionalCents = web3.toBigNumber('0');
        // action
        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: web3.toBigNumber('0'), from: emitter}
        );

        // checking result
        var actualBeneficiary = yield bvc.beneficiary();
        var actualEmitter = yield bvc.emitter();
        var actualNotionalValue = yield bvc.notionalCents();

        assert.equal(
            beneficiary.toString(), actualBeneficiary.toString(),
            "beneficiary mismatch"
        );
        assert.equal(
            emitter.toString(), actualEmitter.toString(),
            "emitter mismatch"
        );
        assert.equal(
            notionalCents.toString(), actualNotionalValue.toString(),
            "notionalCents mismatch"
        );
    });

    it("should require 2x ETH of notionalCents", function* () {
        let notionalCents = cents(10);
        let bvc;
        let bufferMargin;

        // attempt to deploy without sending enough ether
        // ensure fails (somehow)
        bufferMargin = 1.9;
        var notEnoughWei = notionalCents.times(bufferMargin).times(weiPerCent);

        var failed = false;
        try {
            bvc = yield BackedValueContract.new(
                services.address, emitter, beneficiary, notionalCents,
                {value: notEnoughWei, from: emitter}
            );
        } catch (e) {
            failed = true;
        }
        assert.equal(failed, true);

        // attempt to deploy AND send enough ether
        // ensure succeeds
        bufferMargin = 2.1;
        var enoughWei = notionalCents.times(bufferMargin).times(weiPerCent);

        bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: enoughWei, from: emitter}
        );

        var actualNotionalCents = yield bvc.notionalCents();
        assert.equal(
            notionalCents.toString(), actualNotionalCents.toString(),
            "notionalCents mismatch"
        );
    });

    it("should allow beneficiary withdrawal", function* () {
        var notionalCents = cents(10);

        var bvc = yield BackedValueContract.new(
            beneficiary, notionalCents, {
                value: minimumWeiForCents(notionalCents, weiPerCent),
                from: emitter
            }
        );
        console.log("deployed bvc");

        var failed = false;
        try {
            yield bvc.withdraw(cents(11), {from: beneficiary});
        } catch (e) {
            failed = true;
        }
        assert.equal(failed, true);
        console.log("post withdraw 1");

        var remainingNotionalCents = yield bvc.notionalCents();
        assert.equal(remainingNotionalCents.toString(), cents(10).toString());

        yield bvc.withdraw(cents(9), {from: beneficiary});
        console.log("post withdraw 2");
        remainingNotionalCents = yield bvc.notionalCents();
        assert.equal(remainingNotionalCents.toString(), cents(1).toString());





    });
});
