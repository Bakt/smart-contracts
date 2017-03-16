module.exports = {
    networks: {
        "development": {
            host: "testrpc",
            port: 8545,
            network_id: "*"
        },
        "testnet": {
            host: "parity-testnet",
            port: 8545,
            network_id: 42,
            gas: 4000000
        }
    },
};
