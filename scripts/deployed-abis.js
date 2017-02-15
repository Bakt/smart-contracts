const co  = require('../node_modules/co');

var ExchangeRate = artifacts.require("ExchangeRate.sol");
var Factory = artifacts.require("Factory.sol");
var BackedValueContract = artifacts.require("BackedValueContract.sol");

const logHeader = function(name) {
    console.log(name + "\n" + Array(name.length).join("="));
    console.log("");
}

const logAddress = function(address) {
    console.log("address: **" + address + "**");
    console.log("");
}

const logABI = function(abi) {
    console.log("abi:");
    console.log("> ```json");
    console.log(JSON.stringify(abi));
    console.log("```");
    console.log("");
}

module.exports = co.wrap(function* (callback) {
    let exchangeRate = yield ExchangeRate.deployed();
    let factory = yield Factory.deployed();

    logHeader("ExchangeRate");
    logAddress(exchangeRate.address);
    logABI(exchangeRate.abi);

    console.log("");

    logHeader("Factory");
    logAddress(factory.address);
    logABI(factory.abi);

    console.log("");

    logHeader("BackedValueContract");
    logABI(BackedValueContract.abi);

    callback();
});
