const co = require('../node_modules/co');
const requestify = require('../node_modules/requestify');
const { asyncDeploy } = require('../lib/deployment');

var Services = artifacts.require("Services.sol");
var BridgedOraclizeFacade = artifacts.require("BridgedOraclizeFacade.sol");
var OraclizeFacade = artifacts.require("OraclizeFacade.sol");

const deployDevFacade = co.wrap(function *(deployer) {
    console.log(
        "  Development or test network, deploying BridgedOraclizeFacade"
    );

    let response = yield requestify.get('http://oraclize-bridge-announce');
    let oar = response.body;

    yield deployer.deploy(BridgedOraclizeFacade, oar);
    return yield BridgedOraclizeFacade.deployed();
});

const deployExternFacade = co.wrap(function *(deployer) {
    yield deployer.deploy(OraclizeFacade);
    return yield BridgedOraclizeFacade.deployed();
});

module.exports = asyncDeploy(function *(deployer, network) {
    var facadeStrategy;
    if (network === 'development') {
        facadeStrategy = deployDevFacade;
    } else {
        facadeStrategy = deployExternFacade;
    }

    let facade = yield facadeStrategy(deployer);

    console.log("  Registering facade service...");
    let services = yield Services.deployed();
    yield services.specifyService(
        web3.sha3("OraclizeFacade"), facade.address
    )

    return facade;
});
