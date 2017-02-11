require('mocha-generators').install();

var { cents, fetchEvent } = require('./helpers');

var BackedValueContract = artifacts.require('BackedValueContract.sol');
var Services = artifacts.require('Services.sol');

contract('BackedValueContract', function(accounts) {
    let emitter = accounts[0];
    let beneficiary = accounts[1];
    var services;

    before(function *() {
        services = yield Services.deployed();
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
        var notionalCents = cents(100);
        var bvc;

        // attempt to deploy without sending enough ether
        // ensure fails (somehow)
        var ethValue = web3.toBigNumber('0');
        var failed = false;
        try {
            bvc = yield BackedValueContract.new(
                services.address, emitter, beneficiary, notionalCents,
                {value: ethValue, from: emitter}
            );
        } catch (e) {
            console.log(e);
            failed = true;
        }
        assert.equal(failed, true);

        // attempt to deploy AND send enough ether
        // ensure succeeds
    });

    // it("should allow beneficiary withdrawal", function* () {
    //     // setup
    //     var notionalCents = web3.toBigNumber('1000000');
    //     // action
    //     var bvc = yield BackedValueContract.new(
    //         beneficiary, notionalCents, {from: emitter}
    //     );

    //     yield


    // });
});
