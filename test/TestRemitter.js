require('mocha-generators').install();

var { fetchEvent } = require('./helpers');

var Remitter = artifacts.require('Remitter.sol');

contract('Remitter', function(accounts) {
    it("should calculate overhead gas costs", function* () {
        let remitter = yield Remitter.deployed();

        let result = yield remitter.facilitateInstrumentation(1, {from: accounts[1]});

        var debtLog = null;
        for (let log of result.logs) {
            if (log.event == 'RemittanceOwed') debtLog = log;
        }

        assert.isOk(debtLog);

        let gasPrice = web3.eth.gasPrice;

        let weiOwed = debtLog.args.totalWeiOwed;
        console.log("wei owed: ", weiOwed.toString());

        let gasUsed = web3.toBigNumber(result.receipt.gasUsed);
        console.log("total gas used: ", gasUsed.toString());

        let gasWei = gasUsed.times(gasPrice);
        console.log("total wei spent on gas: ", gasWei.toString());

        let overhead = gasWei.minus(weiOwed).dividedBy(gasPrice);
        console.log("esimated overhead gas: ", overhead.toString());

        // take 2
        let result2 = yield remitter.facilitateInstrumentation(50, {from: accounts[2]});

        var debtLog = null;
        for (let log of result2.logs) {
            if (log.event == 'RemittanceOwed') debtLog = log;
        }

        let weiOwed2 = debtLog.args.totalWeiOwed;
        console.log("wei owed 2: ", weiOwed2.toString());

        let gasUsed2 = web3.toBigNumber(result2.receipt.gasUsed);
        console.log("total gas used 2: ", gasUsed2.toString());

        let gasWei2 = gasUsed2.times(gasPrice);
        console.log("total wei spent on gas 2: ", gasWei2.toString());

        let overhead2 = gasWei2.minus(weiOwed2).dividedBy(gasPrice);
        console.log("overhead offset 2: ", overhead2.toString());
    });
});
