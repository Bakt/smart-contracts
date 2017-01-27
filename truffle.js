var DefaultBuilder = require("truffle-default-builder");

module.exports = {
    build: new DefaultBuilder({}),

    networks: {
        "ropsten": {
            host: "parity-ropsten",
            port: 8545
        }
    },
    rpc: {
        host: "testrpc",
        port: 8545
    }
};
