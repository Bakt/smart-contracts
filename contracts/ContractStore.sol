pragma solidity ^0.4.8;

import "./Owned.sol";

/**
 * A draft contracts store - holds address and status of all drawn up contracts.
 *
 * Currently just provides a close() when a contract exit occurs and lookups
 * for exists and isOpen.
 */
contract ContractStore is Owned {

    /*
     *  Data
     */

    struct Contract {
        bool open;
        bool exists;
    }

    mapping (address => Contract) contracts;

    // TODO: change to set of open contacts - for now this is a simple way to
    //       pull out list for testing
    address[] contractsArr;

    /*
     *  Modifiers
     */

    modifier checkNotExists(address _addr) {
        if (exists(_addr)) { throw; }
        _;
    }

    modifier checkExists(address _addr) {
        if (!exists(_addr)) { throw; }
        _;
    }

    /*
     *  Functions
     */

    function ContractStore() {

    }

    function add(address _contract)
        external
        checkNotExists(_contract)
    {
        contracts[_contract] = Contract(true, true);
        contractsArr.push(_contract);
    }

    function close(address _contract)
        external
        checkExists(_contract)
    {
        contracts[_contract].open = false;
    }

    function isOpen(address _contract)
        constant
        returns (bool)
    {
        return (contracts[_contract].open == true);
    }

    function exists(address _contract)
        constant
        returns (bool)
    {
        return (contracts[_contract].exists == true);
    }

    function numContracts()
        constant
        returns (uint length)
    {
        length = contractsArr.length;
    }

    function getContract(uint idx)
        constant
        returns (address addr)
    {
        addr = contractsArr[idx];
    }

}
