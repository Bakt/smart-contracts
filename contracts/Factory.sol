pragma solidity ^0.4.8;

import "./BackedValueContract.sol";
import "./WithdrawalsReserves.sol";

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
        address reservesAddress = services.serviceAddress(
            sha3("WithdrawalsReserves")
        );

        WithdrawalsReserves(reservesAddress).transfer(
            participantWei, emitter, bvc, sha3("deposit()")
        );

        WithdrawalsReserves(reservesAddress).transfer(
            participantWei, beneficiary, bvc, sha3("deposit()")
        );

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalCents
        );

        return bvc;
    }
}
