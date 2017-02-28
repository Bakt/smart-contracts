pragma solidity ^0.4.8;

/**
 * @title Owned contract
 * A contract with an owner and a modifier to restrict routines to the owner.
 */
contract Owned {
    address public owner;

    function Owned () {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) throw;
        _;
    }

    function setOwner(address _newOwner)
        onlyOwner
    {
        owner = _newOwner;
    }
}
