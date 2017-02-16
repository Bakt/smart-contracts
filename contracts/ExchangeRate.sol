pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";
import "./ExchangeRateCallbackI.sol";
import "./ServicesI.sol";

contract ExchangeRate {
    uint public weiPerCent;
    uint public lastBlock;

    uint public centsPerEth;

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

    function receiveExchangeRate(uint _centsPerEth) {
        //  wei/eth = 10**18
        //
        //  cents       wei         cents   eth
        //  -------  /  ------  ==  ----- * ---
        //  eth         eth         eth     wei
        //
        //  wei      cents      wei   eth       wei
        //  ---   /  -----  ==  --- * ---    == ---
        //  eth      eth        eth   cents     cents

        uint _weiPerEth = 10**18;
        uint _weiPerCent = _weiPerEth / _centsPerEth;

        centsPerEth = _centsPerEth;
        weiPerCent = _weiPerCent;
        lastBlock = block.number;

        UpdateExchangeRate(_weiPerCent);

        receiver.receiveExchangeRate(_centsPerEth);
    }

    function initFetch() {
        oraclize.query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd");
        FetchExchangeRate();
    }
}
