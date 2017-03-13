pragma solidity ^0.4.8;

contract ServicesI {
    function DOLLAR_TOKEN() constant returns (address);
    function ORACLIZE_FACADE() constant returns (address);
    function EXCHANGE_RATE() constant returns (address);
    function WITHDRAWALS_RESERVES() constant returns (address);
    function FACTORY() constant returns (address);
    function CONTRACT_STORE() constant returns (address);

    function serviceAddress(bytes32 name) constant returns (address);
}
