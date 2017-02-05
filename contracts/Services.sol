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

    function receiveExchangeRate(uint exchangeRate) requireReady {
    }

}
