pragma solidity ^0.4.8;

import {IndexedEnumerableSetLib} from "./vendor/IndexedEnumerableSetLib.sol";

import "./ServicesI.sol";
import "./ExchangeRateCallbackI.sol";

contract Services is ServicesI, ExchangeRateCallbackI {
    mapping (bytes32 => address) services;

    event MissingService(bytes32 name);

    using IndexedEnumerableSetLib for IndexedEnumerableSetLib.IndexedEnumerableSet;
    IndexedEnumerableSetLib.IndexedEnumerableSet missingServices;

    function Services() {
        missingServices.add(_ORACLIZE_FACADE);
        missingServices.add(_EXCHANGE_RATE);
    }

    function specifyService(bytes32 name, address serviceAddress) {
        services[name] = serviceAddress;
        if (missingServices.contains(name)) {
            missingServices.remove(name);
        }
    }

    modifier requireReady() {
        if (missingServices.size() == 0) {
            _;
        } else {
            for (var i=0; i < missingServices.size(); i++) {
                MissingService(missingServices.get(i));
            }
        }

    }

    function serviceAddress(bytes32 name)
        constant
        returns (address)
    {
        if (services[name] == 0x0) throw;

        return services[name];
    }

    function receiveExchangeRate(uint centsPerEth) requireReady {
    }

    /*
     * Service Listings
     */

    bytes32 public _DOLLAR_TOKEN = sha3("DollarToken");
    function dollarToken() constant returns (address) {
        return serviceAddress(_DOLLAR_TOKEN);
    }

    bytes32 public _ORACLIZE_FACADE = sha3("OraclizeFacade");
    function oraclizeFacade() constant returns (address) {
        return serviceAddress(_ORACLIZE_FACADE);
    }

    bytes32 public _EXCHANGE_RATE = sha3("ExchangeRate");
    function exchangeRate() constant returns (address) {
        return serviceAddress(_EXCHANGE_RATE);
    }

    bytes32 public _WITHDRAWAL_RESERVES = sha3("WithdrawalReserves");
    function withdrawalReserves() constant returns (address) {
        return serviceAddress(_WITHDRAWAL_RESERVES);
    }

    bytes32 public _FACTORY = sha3("Factory");
    function factory() constant returns (address) {
        return serviceAddress(_FACTORY);
    }

    bytes32 public _CONTRACT_STORE = sha3("ContractStore");
    function contractStore() constant returns (address) {
        return serviceAddress(_CONTRACT_STORE);
    }

}
