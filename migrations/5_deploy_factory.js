var Services = artifacts.require("Services.sol");
var Factory = artifacts.require("Factory.sol");

module.exports = function(deployer) {
    var services;
    return deployer
        .then(function() {
            return Services.deployed();
        })
        .then(function (instance) {
            services = instance;
            console.log(
                "Deploying Factory with services address ", services.address
            );
            return deployer.deploy(Factory, services.address);
        })
        .then(function () {
            return Factory.deployed();
        })
        .then(function (instance) {
            console.log("Deployed Factory with address ", instance.address);
            console.log("Specifying Factory service");
            return services.specifyService(
                web3.sha3("Factory"), instance.address
            );
        }).then(function () {
            console.log("Service specified");
        });
};

