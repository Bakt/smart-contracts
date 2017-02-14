pragma solidity ^0.4.8;

import "./BackedValueContract.sol";

contract Factory {
    address servicesAddress;

    function Factory(address _servicesAddress) {
        servicesAddress = _servicesAddress;
    }

    event NewBackedValueContract(
        address contractAddress,
        address emitter,
        address beneficiary,
        uint notionalCents
    );

    function createBackedValueContract(address beneficiary, uint notionalCents)
        returns (address)
    {
        var emitter = msg.sender;

        address bvc = new BackedValueContract(
            servicesAddress, emitter, beneficiary, notionalCents
        );

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalCents
        );

        return bvc;
    }
}
