const EntryChannel = artifacts.require("./EntryChannel.sol")

contract('EntryChannel', (accounts) => {

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

    function newEntryChannel(marketAddr) {
        return EntryChannel.new(marketAddr ? marketAddr : "0x0")
    }

})
