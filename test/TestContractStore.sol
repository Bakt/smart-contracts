
pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ContractStore.sol";
import "../contracts/BackedValueContract.sol";
import "../contracts/Services.sol";

contract TestContractStore {

    address A1 = 0x1;
    address A2 = 0x2;

    address services = new Services();

    function testBasicFlow() {
        ContractStore db = new ContractStore();

        address bvc = newBVC(A1, A2, 100);
        db.add(bvc, A1, A2);
        Assert.isTrue(db.exists(bvc), "bvc exists");
        Assert.isTrue(db.isOpen(bvc), "bvc open");

        db.close(bvc);
        Assert.isTrue(db.exists(bvc), "bvc exists after close");
        Assert.isFalse(db.isOpen(bvc), "bvc not open");

        uint num = db.numContracts();
        Assert.equal(num, 1, "1 contract in store");
        Assert.equal(db.getContract(0), bvc, "get returns correct address");
        Assert.equal(db.getContractAccount(A1, 0), bvc, "get by account returns correct address");
        Assert.equal(db.getContractAccount(A2, 0), bvc, "get by account returns correct address");
    }

    function testNumContracts() {
        ContractStore db = new ContractStore();

        uint num = db.numContracts();
        Assert.equal(num, 0, "no contracts");

        address bvc = newBVC(A1, A2, 100);
        db.add(bvc, A1, A2);

        num = db.numContracts();
        Assert.equal(num, 1, "1 contract in store");
        Assert.equal(db.numContractsAccount(A1), 1, "1 contract for account");
        Assert.equal(db.numContractsAccount(A2), 1, "1 contract for account");
    }

    function newBVC(address emitter, address beneficiary, uint amount)
        internal
        returns (address bvc)
    {
        bvc = new BackedValueContract(
            services,
            emitter,
            beneficiary,
            amount
        );
    }

}
