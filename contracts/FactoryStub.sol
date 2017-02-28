pragma solidity ^0.4.8;

import "../contracts/BackedValueContractStub.sol";

/**
 * Stub version of dollar_token Factory for testing before integration.
 */
contract FactoryStub {

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
        address bvc = new BackedValueContractStub(
            emitter, beneficiary, notionalCents
        );

        BackedValueContractStub(bvc).deposit.value(msg.value)();

        NewBackedValueContract(
            bvc, emitter, beneficiary, notionalCents
        );

        return bvc;
    }
}
