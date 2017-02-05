var DefaultBuilder = require("truffle-default-builder");

module.exports = {
    build: new DefaultBuilder({}),

    networks: {
        "development": {
            host: "testrpc",
            port: 8545,
            network_id: "*"
        },
        "ropsten": {
            host: "parity-ropsten",
            port: 8545,
            network_id: 3
        }
    },
};
