require('mocha-generators').install();

var { fetchEvent } = require('./helpers');

var Factory = artifacts.require("Factory.sol");
var BackedValueContract = artifacts.require("BackedValueContract");

contract("Factory", function(accounts) {
    let emitter = accounts[0];
    let beneficiary = accounts[1];

    it("should deploy BackedValueContracts", function* () {
        // setup
        var notionalCents = web3.toBigNumber('1000000');
        var factory = yield Factory.deployed();

        // action
        yield factory.createBackedValueContract(
            beneficiary, notionalCents, {from: emitter}
        );

        var log = yield fetchEvent(factory.NewBackedValueContract("latest"));

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

