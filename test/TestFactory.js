require('mocha-generators').install();

var { cents, fetchEvent } = require('./helpers');

var ExchangeRate = artifacts.require("ExchangeRate.sol");
var Factory = artifacts.require("Factory.sol");
var BackedValueContract = artifacts.require("BackedValueContract");

contract("Factory", function(accounts) {
    let emitter = accounts[0];
    let beneficiary = accounts[1];
    var weiPerCent;

    let minimumWeiForCents = function(notionalCents) {
        let bufferMargin = 2.0;

        return notionalCents.times(bufferMargin).times(weiPerCent)
    }

    before(function *() {
        exchangeRate = yield ExchangeRate.deployed();

        yield exchangeRate.receiveExchangeRate(cents(1000), {from: emitter});

        weiPerCent = yield exchangeRate.weiPerCent();
    });


    it("should deploy BackedValueContracts", function* () {
        // setup
        var notionalCents = cents(10);
        var factory = yield Factory.deployed();

        // action
        yield factory.createBackedValueContract(
            beneficiary, notionalCents,
            {value: minimumWeiForCents(notionalCents), from: emitter}
        );

        var log = yield fetchEvent(factory.NewBackedValueContract());

        var bvcAddress = log.args.contractAddress;

        // checking result
        var bvc = BackedValueContract.at(bvcAddress);

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
});

