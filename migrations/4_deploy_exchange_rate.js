var Services = artifacts.require("Services.sol");
var ExchangeRate = artifacts.require("ExchangeRate.sol");

module.exports = function(deployer) {
    var services;
    return deployer
        .then(function() {
            return Services.deployed();
        })
        .then(function (instance) {
            services = instance;
            console.log(
                "Deploying ExchangeRate with services address ", services.address
            );
            return deployer.deploy(ExchangeRate, services.address);
        })
        .then(function () {
            return ExchangeRate.deployed();
        })
        .then(function (instance) {
            console.log("Deployed ExchangeRate with address ", instance.address);
            console.log("Specifying ExchangeRate service");
            return services.specifyService(
                web3.sha3("ExchangeRate"), instance.address
            );
        }).then(function () {
            console.log("Service specified");
        });
};

