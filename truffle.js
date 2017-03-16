module.exports = {
    networks: {
        "development": {
            host: "172.19.0.2",
            port: 8545,
            network_id: "*"
        },
        "testnet": {
            host: "52.221.123.6",
            port: 8545,
            network_id: 42,
            gas: 4000000
        }
    },
};
