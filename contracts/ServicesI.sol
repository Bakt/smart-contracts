pragma solidity ^0.4.8;

contract ServicesI {
    bytes32 public _ORACLIZE_FACADE = sha3("OraclizeFacade");
    bytes32 public _EXCHANGE_RATE = sha3("ExchangeRate");

    address constant public ORACLIZE_FACADE = serviceAddress(_ORACLIZE_FACADE);
    address constant public EXCHANGE_RATE = serviceAddress(_EXCHANGE_RATE);

    function serviceAddress(bytes32 name) constant returns (address);
}
