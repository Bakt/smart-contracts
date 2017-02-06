pragma solidity ^0.4.8;

import {IndexedEnumerableSetLib} from "./vendor/IndexedEnumerableSetLib.sol";

contract Remitter {
    using IndexedEnumerableSetLib for IndexedEnumerableSetLib.IndexedEnumerableSet;
    IndexedEnumerableSetLib.IndexedEnumerableSet debtHashes;

    struct Debt {
        uint totalWeiOwed;
    }

    mapping (address => Debt) debts;

    uint knownOverhead;

    event RemittanceOwed(address executor, uint totalWeiOwed);

    function recordOwedRemittance(address executor, uint startGas) {
        var remainingGas = msg.gas;
        var gasUsed = (startGas - remainingGas);
        recordDebt(executor, gasUsed);
    }

    function recordDebt(address executor, uint gasUsed) internal {
        var weiAmount = (gasUsed + knownOverhead) * tx.gasprice;
        debts[executor].totalWeiOwed += weiAmount;
        debtHashes.add(bytes32(executor));

        RemittanceOwed(executor, weiAmount);
    }

    function withdraw() {
        if (msg.sender.send(debts[msg.sender].totalWeiOwed)) {
            debts[msg.sender].totalWeiOwed = 0;
            debtHashes.remove(bytes32(msg.sender));
        }
        RemittanceOwed(msg.sender, debts[msg.sender].totalWeiOwed);
    }

    function () payable {}

    function setKnownOverhead(uint _knownOverhead) {
        knownOverhead = _knownOverhead;
    }

    function totalDebt() constant returns (uint totalDebt) {
        totalDebt = 0;
        for (var i=0; i < debtHashes.size(); i++) {
            var executor = debtHashes.get(i);
            totalDebt += debts[address(executor)].totalWeiOwed;
        }
    }

    uint _instrumentationCounter;

    function facilitateInstrumentation(uint complexity) {
        var startGas = msg.gas;
        var executor = msg.sender;

        // this really just does things a bunch of times, more complex,
        // more iterations. maybe for calibration?
        _instrumentationCounter = 1;
        for (var i=0; i<complexity; i++) {
            _instrumentationCounter *= i+1;
        }

        recordOwedRemittance(executor, startGas);
    }
}
