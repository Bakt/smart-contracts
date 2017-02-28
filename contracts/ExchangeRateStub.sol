pragma solidity ^0.4.7;

/**
 * Stub version of dollar_token Factory for testing before integration.
 */
contract ExchangeRateStub {
    uint public weiPerCent;

    function ExchangeRateStub(uint _initialWeiPerCent) {
        weiPerCent = _initialWeiPerCent;
    }
}
