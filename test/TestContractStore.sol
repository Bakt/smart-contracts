
pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ContractStore.sol";

contract TestContractStore {

    address C1 = 0x1;

    function testBasicFlow() {
        ContractStore db = new ContractStore();

        db.add(C1);
        Assert.isTrue(db.exists(C1), "C1 exists");
        Assert.isTrue(db.isOpen(C1), "C1 open");

        db.close(C1);
        Assert.isTrue(db.exists(C1), "C1 exists after close");
        Assert.isFalse(db.isOpen(C1), "C1 not open");

        uint num = db.numContracts();
        Assert.equal(num, 1, "1 contract in store");
        address addr = db.getContract(0);
        Assert.equal(addr, C1, "contract is C1");
    }

    function testNumContracts() {
        ContractStore db = new ContractStore();
        uint num = db.numContracts();
        Assert.equal(num, 0, "no contracts");
        db.add(C1);
        num = db.numContracts();
        Assert.equal(num, 1, "1 contract in store");
    }

}
