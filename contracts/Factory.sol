pragma solidity ^0.4.8;

import "./BackedValueContract.sol";
import "./WithdrawalReserves.sol";

contract Factory {
    bytes32 constant DEPOSIT_SHA = sha3("deposit()");

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

    function createBackedValueContract(
        address emitter,
        address beneficiary,
        uint notionalCents,
        uint participantWei
    )
        returns (address)
    {
        address bvc = new BackedValueContract(
            servicesAddress, emitter, beneficiary, notionalCents
        );

        ServicesI services = ServicesI(servicesAddress);

        WithdrawalReserves(services.withdrawalReserves()).transfer(
            participantWei, emitter, bvc, DEPOSIT_SHA
        );

        WithdrawalReserves(services.withdrawalReserves()).transfer(
            participantWei, beneficiary, bvc, DEPOSIT_SHA
        );

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalCents
        );

        return bvc;
    }
}
