pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";
import "./ExchangeRateCallbackI.sol";
import "./ServicesI.sol";

contract ExchangeRate {
    uint public weiPerCent;
    uint public lastBlock;

    OraclizeFacade oraclize;
    ExchangeRateCallbackI receiver;

    // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
    event UpdateExchangeRate(uint weiPerCent);
    event FetchExchangeRate();

    function ExchangeRate(address _servicesAddress) {
        updateServices(_servicesAddress);
    }

    function updateServices(address _servicesAddress) {
        ServicesI services = ServicesI(_servicesAddress);

        oraclize = OraclizeFacade(services.ORACLIZE_FACADE());
        oraclize.setCallback(this);

        receiver = ExchangeRateCallbackI(services);
    }

    function receiveExchangeRate(uint _weiPerCent) {
        weiPerCent = _weiPerCent;
        lastBlock = block.number;
        UpdateExchangeRate(_weiPerCent);

        receiver.receiveExchangeRate(_weiPerCent);
    }

    function initFetch() {
        oraclize.query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd");
        FetchExchangeRate();
    }
}
