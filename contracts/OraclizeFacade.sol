pragma solidity ^0.4.7;

import "./vendor/OraclizeI.sol";
import "./CallbackI.sol";

contract OraclizeFacade is usingOraclize {
    CallbackI cb;

    function setCallback(address _cbAddress) {
        cb = CallbackI(_cbAddress);
    }

    function __callback(bytes32 id, string result, bytes proof) {
        if (msg.sender != oraclize_cbAddress()) throw;
        uint parsedResult = parseInt(result, 3) * 1000000000000000; //note, 1000000000000000 is (1 ether)/10^3
        if (parsedResult<=0) throw;
        cb.__callback(parsedResult);
    }

    function query(string datasource,
                   string arg)
               returns (bytes32 g)
    {
        return oraclize_query(datasource, arg);
    }
}
