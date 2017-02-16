var IndexedEnumerableSetLib = artifacts.require("./vendor/IndexedEnumerableSetLib.sol");
var Services = artifacts.require("Services.sol");
const { asyncDeploy } = require('../lib/deployment');

const SafeSendLib = artifacts.require("SafeSendLib.sol");
const MathLib = artifacts.require("MathLib.sol");

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.deploy(MathLib);
    yield deployer.link(MathLib, SafeSendLib);
    yield deployer.deploy(SafeSendLib);

    yield deployer.deploy(IndexedEnumerableSetLib);
    yield deployer.link(IndexedEnumerableSetLib, Services);
    yield deployer.deploy(Services);
});
