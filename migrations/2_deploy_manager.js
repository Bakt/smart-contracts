var IndexedEnumerableSetLib = artifacts.require("./vendor/IndexedEnumerableSetLib.sol");
var Manager = artifacts.require("Manager.sol");

module.exports = function(deployer, network) {
    deployer.deploy(IndexedEnumerableSetLib);
    deployer.link(IndexedEnumerableSetLib, Manager);
    deployer.deploy(Manager);
};
