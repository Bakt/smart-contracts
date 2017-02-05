require('mocha-generators').install();

var { fetchEvent } = require('./helpers');

var BackedValueContract = artifacts.require('BackedValueContract.sol');

contract('BackedValueContract', function(accounts) {
    let emitter = accounts[0];
    let beneficiary = accounts[1];

    it("should be deployable", function* () {
        // setup
        var notionalValue = web3.toBigNumber('1000000');
        // action
        var bvc = yield BackedValueContract.new(
            beneficiary, notionalValue, {from: emitter}
        );

        // checking result
        var actualBeneficiary = yield bvc.beneficiary();
        var actualEmitter = yield bvc.emitter();
        var actualNotionalValue = yield bvc.notionalValue();

        assert.equal(beneficiary.toString(), actualBeneficiary.toString());
        assert.equal(emitter.toString(), actualEmitter.toString());
        assert.equal(notionalValue.toString(), actualNotionalValue.toString());
    });
});
