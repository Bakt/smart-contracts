const co = require('co');

const deployService = co.wrap(function *(web3, deployer, artifacts, service) {
    const Services = artifacts.require("Services.sol");
    let services = yield Services.deployed()

    yield deployer.deploy(service, services.address);
    let instance = yield service.deployed();

    console.log("  Registering service...");
    yield services.specifyService(
        web3.sha3(service.contract_name), instance.address
    );
    console.log("  Registered.");

    return instance;
});

module.exports = {
    deployService
}
