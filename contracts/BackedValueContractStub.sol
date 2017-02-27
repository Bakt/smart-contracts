pragma solidity ^0.4.8;

/**
 * Simple BackedValueContract for testing before integration.
 */
contract BackedValueContractStub {

    address public emitter;
    address public beneficiary;
    uint public notionalCents;

    function BackedValueContractStub(address _emitter,
                                 address _beneficiary,
                                 uint _notionalCents)
        payable
    {
        emitter = _emitter;
        beneficiary = _beneficiary;
        notionalCents = _notionalCents;
    }

    function deposit() payable {
    }

}
