pragma solidity ^0.4.7;

import "./vendor/OraclizeI.sol";
import "./ExchangeRateCallbackI.sol";

contract OraclizeFacade is usingOraclize {
    ExchangeRateCallbackI cb;

    function setCallback(address _cbAddress) {
        cb = ExchangeRateCallbackI(_cbAddress);
    }

    function __callback(bytes32 id, string result, bytes proof) {
        if (msg.sender != oraclize_cbAddress()) throw;
        uint centsPerEth = parseInt(result, 2);
        cb.receiveExchangeRate(centsPerEth);
    }

    function query(string datasource,
                   string arg)
               returns (bytes32 g)
    {
        return oraclize_query(datasource, arg);
    }
}
