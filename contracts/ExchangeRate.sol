pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";

contract ExchangeRate {
    uint public exchangeRate;
    uint public lastBlock;

    uint blockDelay; // minimum delay
    uint reserve; // value the contract should keep


    OraclizeFacade oraclize;

    // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
    event UpdateExchangeRate(uint exchangeRate);
    event FetchExchangeRate();

    function ExchangeRate(address _oraclizeFacade) {
        oraclize = OraclizeFacade(_oraclizeFacade);
        oraclize.setCallback(this);
    }

    modifier notTooFrequently() {
        if (lastBlock + blockDelay >= block.number) throw;
        _;
    }

    modifier notExceedingReserve() {
        _;
        if (this.balance < reserve) throw;
    }

    function deposit() payable {
    }

    function __callback(uint result) {
        exchangeRate = result;
        lastBlock = block.number;

        UpdateExchangeRate(exchangeRate);
    }

    function initFetch() /*notTooFrequently() notExceedingReserve()*/ {
        oraclize.query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd");
        FetchExchangeRate();
    }
}
