var Manager = artifacts.require("Manager.sol");
var ExchangeRate = artifacts.require("ExchangeRate.sol");

module.exports = function(deployer) {
    var manager;
    return deployer
        .then(function() {
            return Manager.deployed();
        })
        .then(function (instance) {
            manager = instance;
            console.log(
                "Deploying ExchangeRate with manager address ", manager.address
            );
            return deployer.deploy(ExchangeRate, manager.address);
        })
        .then(function () {
            return ExchangeRate.deployed();
        })
        .then(function (instance) {
            console.log("Deployed ExchangeRate with address ", instance.address);
            console.log("Specifying ExchangeRate service");
            return manager.specifyService(
                web3.sha3("ExchangeRate"), instance.address
            );
        }).then(function () {
            console.log("Service specified");
        });
};

