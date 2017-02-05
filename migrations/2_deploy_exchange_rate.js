var ExchangeRate = artifacts.require("ExchangeRate.sol");
var BridgedOraclizeFacade = artifacts.require("BridgedOraclizeFacade.sol");
var OraclizeFacade = artifacts.require("OraclizeFacade.sol");

module.exports = function(deployer, network) {
    var deployExchangeRate = function (facade) {
        var address = facade.address;
        console.log("Deploying ExchangeRate, using facade with address ", address);
        return deployer.deploy(ExchangeRate, address);
    }

    if (network === 'development') {
        console.log(
            "Default or test network, deploying BridgedOraclizeFacade " +
            "with custom OAR address"
        );
        var requestify = require('../node_modules/requestify/index.js');

        deployer
            .then(function () {
                return requestify.get('http://oraclize-bridge-announce')
            })
            .then(function(response) {
                var oar = response.body;
                return oar;
            })
            .then(function (oar) {
                console.log("Deploying BridgedOraclizeFacade(" + oar + ")");
                return deployer.deploy(BridgedOraclizeFacade, oar);
            })
            .then(function () {
                return deployExchangeRate(BridgedOraclizeFacade)
            })
            .then(function() {
                console.log("Deployed ExchangeRate to " + ExchangeRate.address);
            });
    } else {
        console.log("Deploying OraclizeFacade");
        deployer
            .deploy(OraclizeFacade)
            .then(function() { return deployExchangeRate(OraclizeFacade) })
            .then(function() {
                console.log("Deployed ExchangeRate to " + ExchangeRate.address);
            });
    }
};
