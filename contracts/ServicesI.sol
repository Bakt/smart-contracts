pragma solidity ^0.4.8;

contract ServicesI {
    function dollarToken() constant returns (address);
    function oraclizeFacade() constant returns (address);
    function exchangeRate() constant returns (address);
    function withdrawalReserves() constant returns (address);
    function factory() constant returns (address);
    function contractStore() constant returns (address);

    function serviceAddress(bytes32 name) constant returns (address);
}
