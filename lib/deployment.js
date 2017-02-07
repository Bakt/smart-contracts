function deployService(web3, deployer, artifacts, service) {
    let serviceName = service.contract_name;
    let Services = artifacts.require("Services.sol");

    // to be populated with data
    var services;
    var deployedService;

    return deployer.then(function() {
        return Services.deployed();
    }).then(function (instance) {
        services = instance;
        console.log("  * Found Services instance at", services.address);

        return deployer.deploy(service, services.address);
    }).then(function () {
        return service.deployed();
    }).then(function (instance) {
        deployedService = instance
        console.log("  * Registering service");
        return services.specifyService(
            web3.sha3(serviceName), deployedService.address
        );
    }).then(function () {
        console.log("  * Registration complete");
        return deployedService;
    });
}

module.exports = {
    deployService
}
