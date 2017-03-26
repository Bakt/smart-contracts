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
        uint thresholdWarningLevel;
        uint thresholdDissolveLevel;
    }

    // TODO: revisit these data structures - for now this is a simple set of
    //       of structures for testing

    mapping (address => Contract) contracts;
    mapping (address => address[]) accountsMap;

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

    function add(address _contract, address _account1, address _account2)
        external
        checkNotExists(_contract)
    {
        contracts[_contract] = Contract(true, true, 1, 1);
        contractsArr.push(_contract);
        accountsMap[_account1].push(_contract);
        accountsMap[_account2].push(_contract);
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

    function thresholdWarningLevel(address _contract)
        constant
        returns (uint weiPerCent)
    {
        weiPerCent = contracts[_contract].thresholdWarningLevel;
    }

    function thresholdDissolveLevel(address _contract)
        constant
        returns (uint weiPerCent)
    {
        weiPerCent = contracts[_contract].thresholdDissolveLevel;
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

    function numContractsAccount(address _account)
        constant
        returns (uint length)
    {
        length = accountsMap[_account].length;
    }

    function getContractAccount(address _account, uint idx)
        constant
        returns (address addr)
    {
        addr = accountsMap[_account][idx];
    }

}
