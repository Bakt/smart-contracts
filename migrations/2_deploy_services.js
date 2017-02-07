var IndexedEnumerableSetLib = artifacts.require("./vendor/IndexedEnumerableSetLib.sol");
var Services = artifacts.require("Services.sol");
const { asyncDeploy } = require('../lib/deployment');

module.exports = asyncDeploy(function *(deployer) {
    yield deployer.deploy(IndexedEnumerableSetLib);
    yield deployer.link(IndexedEnumerableSetLib, Services);
    yield deployer.deploy(Services);
});
