var IndexedEnumerableSetLib = artifacts.require("./vendor/IndexedEnumerableSetLib.sol");
var Services = artifacts.require("Services.sol");
var Remitter = artifacts.require("Remitter.sol");

module.exports = function(deployer) {
    deployer.link(IndexedEnumerableSetLib, Remitter);

    var services;
    return deployer
        .then(function() {
            return Services.deployed();
        })
        .then(function (instance) {
            services = instance;
            console.log(
                "Deploying Remitter with services address ", services.address
            );
            return deployer.deploy(Remitter, services.address);
        })
        .then(function () {
            return Remitter.deployed();
        })
        .then(function (instance) {
            console.log("Deployed Remitter with address ", instance.address);
            console.log("Specifying Remitter service");
            return services.specifyService(
                web3.sha3("Remitter"), instance.address
            );
        }).then(function () {
            console.log("Service specified");
        });
};

