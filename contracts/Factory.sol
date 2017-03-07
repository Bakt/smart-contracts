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

    function createBackedValueContract(address emitter, address beneficiary, uint notionalCents)
        payable
        returns (address)
    {
        address bvc = new BackedValueContract(
            servicesAddress, emitter, beneficiary, notionalCents
        );

        BackedValueContract(bvc).deposit.value(msg.value)();

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalCents
        );

        return bvc;
    }
}
