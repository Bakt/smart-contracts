pragma solidity ^0.4.8;

/**
* Each EntryChannel contract accepts ether transfers and passes them on to
* the MarketQueues by calling MarketQueues.createEntry(). An entry is an
* entry in a market queue - ie. a request to enter a contract.

 * An instance of this contract exists for each queue.
 *
 * For example: one for an ether guy and one for opposing dollar guy in the
 * case of the stable USD to ether market.
 */
contract EntryChannel {
    /*
     *  Constants
     */
    // at least one wei.
    // TODO: revisit - should probably be 1 DOLLAR 
    uint constant MIN_VALUE_TRANSFER = 1;

    /*
     *  Data
     */
    address public market;

    /*
     *  Modifiers
     */
    modifier enoughEth() {
        if (msg.value < MIN_VALUE_TRANSFER) { throw; }
        _;
    }

    /*
     *  Functions
     */
    function EntryChannel(address _market)
    {
        market = _market;
    }

    function()
        enoughEth
        payable
    {
        // Use a generic call here to avoid having a dependency on MarketQueues.
        // This allows MarketQueues to depend on and create EntryChannels
        // without having an import statement based cyclic dependency.
        if (!market.call.value(msg.value)(
                bytes4(sha3("createEntry(address)")),
                msg.sender
            )) throw;
    }

}
