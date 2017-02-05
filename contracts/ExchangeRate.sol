pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";
import "./ExchangeRateCallbackI.sol";
import "./ServicesI.sol";

contract ExchangeRate {
    uint public exchangeRate;
    uint public lastBlock;

    OraclizeFacade oraclize;
    ExchangeRateCallbackI receiver;

    // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
    event UpdateExchangeRate(uint exchangeRate);
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

    function receiveExchangeRate(uint exchangeRate) {
        lastBlock = block.number;
        UpdateExchangeRate(exchangeRate);

        receiver.receiveExchangeRate(exchangeRate);
    }

    function initFetch() {
        oraclize.query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd");
        FetchExchangeRate();
    }
}
