var Services = artifacts.require("Services.sol");
var BridgedOraclizeFacade = artifacts.require("BridgedOraclizeFacade.sol");
var OraclizeFacade = artifacts.require("OraclizeFacade.sol");

module.exports = function(deployer, network) {
    var deployDevelopmentFacade = function() {
        console.log(
            "Default or test network, deploying BridgedOraclizeFacade " +
            "with custom OAR address"
        );
        var requestify = require('../node_modules/requestify/index.js');

        return deployer
            .then(function () {
                return requestify.get('http://oraclize-bridge-announce')
            })
            .then(function(response) {
                var oar = response.body;
                return oar;
            })
            .then(function (oar) {
                console.log("Deploying BridgedOraclizeFacade(" + oar + ")");
                return BridgedOraclizeFacade.new(oar);
            })
    }

    var deployFacade = function() {
        console.log("Deploying OraclizeFacade");
        return OraclizeFacade.new();
    }

    var facadeStrategy;
    if (network === 'development') {
        facadeStrategy = deployDevelopmentFacade;
    } else {
        facadeStrategy = deployFacade;
    }

    var facade;
    return facadeStrategy()
        .then(function (instance) {
            facade = instance;
            console.log("Specifying facade service ", facade.address);
            console.log(web3.sha3("OraclizeFacade"));
            return Services.deployed();
        }).then(function (services) {
            return services.specifyService(
                web3.sha3("OraclizeFacade"), facade.address
            ).then(function () {
                console.log("Service specified");
            });
        });
};
