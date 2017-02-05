pragma solidity ^0.4.8;

import "./ServicesI.sol";
import "./BackedValueContract.sol";

contract Factory {
    ServicesI services;

    function Factory(address _servicesAddress) {
        services = ServicesI(_servicesAddress);
    }

    event NewBackedValueContract(
        address contractAddress,
        address emitter,
        address beneficiary,
        uint notionalValue
    );

    function createBackedValueContract(address beneficiary,
                                       uint notionalValue)
        returns (address)
    {
        var emitter = msg.sender;

        address bvc = new BackedValueContract(
            emitter, beneficiary, notionalValue
        );

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalValue
        );

        return bvc;
    }
}
