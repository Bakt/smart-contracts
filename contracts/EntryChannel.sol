pragma solidity ^0.4.8;

import "./Owned.sol";

/**
* Each EntryChannel contract accepts ether transfers and passes them on to
* a contract given the receiver contract address and method signature.

 * An instance of this contract exists for each queue.
 *
 * For example: one for an emitter and one for a beneficiary in the
 * case of the stable USD to ether market.
 */
contract EntryChannel is Owned {
    /*
     *  Constants
     */
    // at least one wei - TODO: revisit as the receiver contract will probably
    // check this too (min 1 dollar). This is a nice check though to stop a
    // 0 eth call early early.
    uint constant MIN_VALUE_TRANSFER = 1;

    /*
     *  Data
     */
    address public receiver;
    bytes32 public funcSigHash;

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

    /**
     * @dev change the receiver contract to another one
     */
    function setReceiver(address _receiver)
         onlyOwner
    {
        receiver = _receiver;
    }

    /**
     * @dev Address of the receiving contract to pass ether onto as well as the
     *      hash of the function signature to call. The function should take the
     *      senders address as the first argument.
     */
    function EntryChannel(address _receiver, string _funcSig)
    {
        receiver = _receiver;
        funcSigHash = sha3(_funcSig);
    }

    function()
        enoughEth
        payable
    {
        if (!receiver.call.value(msg.value)(
                bytes4(funcSigHash),
                msg.sender
            )) throw;
    }

}
