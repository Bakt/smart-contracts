var IndexedEnumerableSetLib = artifacts.require("./vendor/IndexedEnumerableSetLib.sol");
var Services = artifacts.require("Services.sol");

module.exports = function(deployer, network) {
    deployer.deploy(IndexedEnumerableSetLib);
    deployer.link(IndexedEnumerableSetLib, Services);
    deployer.deploy(Services);
};
