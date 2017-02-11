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
        // parseInt(result, 3)      cents / eth
        //
        //   wei / cent
        //
        //
        //  -> cents / wei
        //  wei/eth = 10**18
        //
        //  cents       wei
        //  -------  /  ------
        //  eth         eth
        //
        //  wei      cents
        //  ---   /  -----  == wei/cents
        //  eth      eth
        uint centsPerEth = parseInt(result, 3);
        uint weiPerEth = 10**18;
        uint weiPerCent = weiPerEth / centsPerEth;
        cb.receiveExchangeRate(weiPerCent);
    }

    function query(string datasource,
                   string arg)
               returns (bytes32 g)
    {
        return oraclize_query(datasource, arg);
    }
}
