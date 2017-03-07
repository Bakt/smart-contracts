const solc = require('solc')
const contract = require('truffle-contract')

const EntryChannel = artifacts.require("./EntryChannel.sol")

const RECEIVER_CONTRACTS_SOURCE = `
pragma solidity ^0.4.8;
contract Receiver {
    function receive(address sender) payable { }
}
`
const FUNC_SIG = 'receive(address)'

contract('EntryChannel', (accounts) => {

    let receiver

    before(() => {
        createContract("Receiver", RECEIVER_CONTRACTS_SOURCE).then((instance) => {
            receiver = instance
        }).catch((err) => {
            console.error(err.message)
            done()
        })
    })

    it("should reject 0 eth transfers", (done) => {
        newEntryChannel().then((entryChannel) => {
            return web3.eth.sendTransaction({
                from: accounts[5],
                to: entryChannel.address,
                value: 0
            })
        }).then(() => {
            assert.fail('expected invalid jump')
        }).catch((err) => {
            assert.include(err.message, "invalid JUMP")
            done()
        })
    })

    function newEntryChannel() {
        return EntryChannel.new(receiver.address, FUNC_SIG)
    }

    function createContract(name, source) {
        const compiledContract = solc.compile(source, 1)
        const abi = compiledContract.contracts[name].interface
        const web3Contract = web3.eth.contract(JSON.parse(abi))
        const ContractAbs = contract(web3Contract)
        ContractAbs.setProvider(web3.currentProvider)
        return ContractAbs.new()
    }

})
