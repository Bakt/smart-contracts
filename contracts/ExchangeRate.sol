pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";
import "./ManagerI.sol";

contract ExchangeRate {
    uint public exchangeRate;
    uint public lastBlock;

    ManagerI manager;

    // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
    event UpdateExchangeRate(uint exchangeRate);
    event FetchExchangeRate();

    function ExchangeRate(address _managerAddress) {
        manager = ManagerI(_managerAddress);

        var oraclize = OraclizeFacade(manager.ORACLIZE_FACADE());
        oraclize.setCallback(this);
    }

    function receiveExchangeRate(uint exchangeRate) {
        lastBlock = block.number;
        UpdateExchangeRate(exchangeRate);

        manager.receiveExchangeRate(exchangeRate);
    }

    function initFetch() {
        var oraclize = OraclizeFacade(manager.ORACLIZE_FACADE());
        oraclize.query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd");
        FetchExchangeRate();
    }
}
