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

    let minimumWeiForCents = function(notionalCents) {
        let bufferMargin = 2.0;

        return notionalCents.times(bufferMargin).times(weiPerCent)
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
        let actualNotionalCents;
        let actualPendingNotionalCents;

        // attempt to deploy without sending enough ether
        // ensure fails (somehow)
        bufferMargin = 1.9;
        var notEnoughWei = notionalCents.times(bufferMargin).times(weiPerCent);

        bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: notEnoughWei, from: emitter}
        );
        actualPendingNotionalCents = yield bvc.pendingNotionalCents();
        assert.equal(
            actualPendingNotionalCents.toString(), notionalCents.toString(),
            "pendingNotionalCents mismatch"
        );

        actualNotionalCents = yield bvc.notionalCents();
        assert.equal(
            actualNotionalCents.toString(), "0",
            "notionalCents mismatch"
        );

        // attempt to deploy AND send enough ether
        // ensure succeeds
        bufferMargin = 2.1;
        var enoughWei = notionalCents.times(bufferMargin).times(weiPerCent);

        bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: enoughWei, from: emitter}
        );

        actualNotionalCents = yield bvc.notionalCents();
        assert.equal(
            notionalCents.toString(), actualNotionalCents.toString(),
            "notionalCents mismatch"
        );
        actualPendingNotionalCents = yield bvc.pendingNotionalCents();
        assert.equal(
            actualPendingNotionalCents.toString(), "0",
            "pendingNotionalCents mismatch"
        );
    });

    it("should enter active state upon enough wei being sent", function* () {
        let notionalCents = cents(100);
        let bvc;
        let currentState;

        // deploy without sending enough ether
        var halfEnough = minimumWeiForCents(notionalCents).dividedToIntegerBy(2);

        bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: halfEnough, from: emitter}
        );
        currentState = yield bvc.currentState();
        assert.equal(currentState.toString(), "pending");

        yield bvc.deposit(
            {value: halfEnough.plus(1) /* rounding */, from: emitter}
        );

        currentState = yield bvc.currentState();
        assert.equal(currentState.toString(), "active");
    });

    it("should prevent beneficiary withdrawal excessive of notional value", function* () {
        let notionalCents = cents(10);

        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents, {
                value: minimumWeiForCents(notionalCents),
                from: emitter
            }
        );

        var failed = false;
        try {
            yield bvc.withdraw(cents(11), {from: beneficiary});
        } catch (e) {
            failed = true;
        }
        assert.equal(failed, true);
    });

    it("should update notional value upon beneficiary withdrawal", function* () {
        let notionalCents = cents(10);

        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents, {
                value: minimumWeiForCents(notionalCents),
                from: emitter
            }
        );

        yield bvc.withdraw(cents(7), {from: beneficiary});
        remainingNotionalCents = yield bvc.notionalCents();
        assert.equal(remainingNotionalCents.toString(), cents(3).toString());

        yield bvc.withdraw(cents(2), {from: beneficiary});
        remainingNotionalCents = yield bvc.notionalCents();
        assert.equal(remainingNotionalCents.toString(), cents(1).toString());

        yield bvc.withdraw(cents(1), {from: beneficiary});
        remainingNotionalCents = yield bvc.notionalCents();
        assert.equal(remainingNotionalCents.toString(), cents(0).toString());
    });

    it("should provide the correct wei equivalent to the beneficiary", function* () {
        let notionalCents = cents(100);
        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents, {
                value: minimumWeiForCents(notionalCents),
                from: emitter
            }
        );

        let withdrawAmount = cents(50);
        let weiEquivalent = withdrawAmount.times(weiPerCent);

        let initialBalance = web3.eth.getBalance(beneficiary);

        let result = yield bvc.withdraw(withdrawAmount, {from: beneficiary});
        let gasUsed = web3.toBigNumber(result.receipt.gasUsed);
        let gasCost = gasUsed.times(web3.eth.getTransaction(result.tx).gasPrice);

        let expectedBalanceAfter = initialBalance.plus(weiEquivalent).minus(gasCost);

        let balanceAfter = web3.eth.getBalance(beneficiary);

        assert.equal(
            balanceAfter.toString(), expectedBalanceAfter.toString(),
            "Balance after withdrawals should equal initial balance " +
            "plus withdrawn value minus gas costs (" +
                web3.fromWei(balanceAfter, "ether").toString() +
                " != " +
                web3.fromWei(initialBalance, "ether").toString() +
                " + " +
                web3.fromWei(weiEquivalent, "ether").toString() +
                " - " +
                web3.fromWei(gasCost, "ether").toString() +
            ")"
        );
    });

    it("should prevent emitter withdrawal excessive of allowed margin", function* () {
        let notionalCents = cents(10);
        let excessAmount = web3.toBigNumber(web3.toWei('0.010', 'ether'));
        let contractWei = minimumWeiForCents(notionalCents).plus(excessAmount);

        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: contractWei, from: emitter}
        );

        var failed = false;
        try {
            yield bvc.withdraw(excessAmount.plus(1), {from: emitter});
        } catch (e) {
            failed = true;
        }
        assert.equal(failed, true);
    });

    it("should have correct balances after emitter withdrawal", function* () {
        let notionalCents = cents(100);
        let excessAmount = web3.toBigNumber(web3.toWei('0.010', 'ether'));
        let contractWei = minimumWeiForCents(notionalCents).plus(excessAmount);

        var bvc = yield BackedValueContract.new(
            services.address, emitter, beneficiary, notionalCents,
            {value: contractWei, from: emitter}
        );

        let withdrawAmount = excessAmount.dividedToIntegerBy(2);

        let initialEmitterBalance = web3.eth.getBalance(emitter);
        let initialContractBalance = web3.eth.getBalance(bvc.address);

        let result = yield bvc.withdraw(withdrawAmount, {from: emitter});
        let gasUsed = web3.toBigNumber(result.receipt.gasUsed);
        let gasCost = gasUsed.times(web3.eth.getTransaction(result.tx).gasPrice);

        let expectedEmitterBalance = initialEmitterBalance
            .plus(withdrawAmount)
            .minus(gasCost);

        let expectedContractBalance = initialContractBalance
            .minus(withdrawAmount);

        let emitterBalanceAfter = web3.eth.getBalance(emitter);
        let contractBalanceAfter = web3.eth.getBalance(bvc.address);

        assert.equal(
            emitterBalanceAfter.toString(), expectedEmitterBalance.toString(),
            "Emitter balance after withdrawals should equal initial balance " +
            "plus withdrawn value minus gas costs (" +
                web3.fromWei(emitterBalanceAfter, "ether").toString() +
                " != " +
                web3.fromWei(initialEmitterBalance, "ether").toString() +
                " + " +
                web3.fromWei(withdrawAmount, "ether").toString() +
                " - " +
                web3.fromWei(gasCost, "ether").toString() +
            ")"
        );

        assert.equal(
            contractBalanceAfter.toString(), expectedContractBalance.toString(),
            "Contract balance after withdrawals should equal initial balance " +
            "minus withdrawn amount (" +
                web3.fromWei(contractBalanceAfter, "ether").toString() +
                " != " +
                web3.fromWei(initialContractBalance, "ether").toString() +
                " - " +
                web3.fromWei(withdrawAmount, "ether").toString() +
            ")"
        );
    });

});
