module.exports = function(deployer) {
    var deployExchangeRate = function (implementation) {
        var address = implementation.address;
        console.log("Deploying ExchangeRate, using facade with address ", address);
        return deployer.deploy(ExchangeRate, address);
    }

    if (deployer.network_id === 'default') {
        console.log(
            "Default network_id used, deploying BridgedOraclizeFacade " +
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
        //console.log(deployer);
    } else {
        console.log("Deploying OraclizeFacade");
        deployer
            .deploy(BaseExchangeRate)
            .then(function() { deployExchangeRate(OraclizeFacade) });
    }
};
