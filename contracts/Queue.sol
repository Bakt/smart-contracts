pragma solidity ^0.4.8;

import "./Owned.sol";
import "./EntryChannel.sol";
import "./EntryQueueLib.sol";

/**
 * A single market represents a market for entering into a 2 party contract.
 * Two parties, dollar and an ether party are required to open a contract.
 * Parties enter a contract by first sending ether to an EntryChannel which
 * results in an entry on a corresponding Queue.
 *
 * Entries sit in the Queues waiting for a match with an opposing entry.
 * An offchain process called the dollarToken draws up a contract when it finds a
 * match between 2 parties in a market.
 */
contract Queue is Owned {

    /*
     *  Events
     */
    event EntryAdded(address indexed channel, address indexed account, bytes32 newEntryId, uint value);
    event EntryRemoved(address indexed channel, bytes32 indexed entryId);
    event QueueStarted();
    event QueueStopped();


    /*
     *  Data
     */
    address public dollarToken;             // DollarToken contract
    address public etherChannel;            // ether guy enters queue here
    address public dollarChannel;           // dollar guy enters queue here

    using EntryQueueLib for EntryQueueLib.Queue;
    EntryQueueLib.Queue etherQueue;
    EntryQueueLib.Queue dollarQueue;

    bool queueOpen;                         // flag allows queue to be stopped in case of emergency


    /*
     *  Modifiers
     */
    modifier fromDollarToken() {
         if (msg.sender != dollarToken) { throw; }
         _;
     }

    modifier fromChannel() {
        if (msg.sender != etherChannel && msg.sender != dollarChannel) { throw; }
        _;
    }

     modifier isOpen() {
         if (queueOpen == false) { throw; }
         _;
     }


    /*
     *  Functions
     */

    function Queue() {
        setDollarToken(0x0);  // setDollarToken called again after DollarToken created
        EntryChannel etherChannel = new EntryChannel(this);
        EntryChannel dollarChannel = new EntryChannel(this);
        etherQueue.init();
        dollarQueue.init();
    }

    function setDollarToken(address _dollarToken)
        onlyOwner
    {
        dollarToken = _dollarToken;
    }

    function createEntry(address _account)
        external
        payable
        isOpen
        fromChannel
        returns (bytes32 entryId)
    {
        address channel = msg.sender;
        // TODO: add a nonce - what if _account creates 2 entries for the same value in the same block?
        entryId = sha3(channel, _account, msg.value, block.number);
        EntryQueueLib.Queue queue = (channel == etherChannel) ? etherQueue : dollarQueue;
		queue.pushTail(entryId, _account, msg.value);
        EntryAdded(channel, _account, entryId, msg.value);
    }

    function getEntryEtherGuy(bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        return etherQueue.get(_entryId);
    }

    function getEntryDollar(bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        return dollarQueue.get(_entryId);
    }

    function getOpenEtherGuy()
        constant
        returns (bytes32[] ids)
    {
        return etherQueue.getOpen();
    }

    function getOpenDollar()
        constant
        returns (bytes32[] ids)
    {
        return dollarQueue.getOpen();
    }

    function lengthEtherGuy()
        constant
        returns (uint length)
    {
        length = etherQueue.length;
    }

    function lengthDollar()
        constant
        returns (uint length)
    {
        length = dollarQueue.length;
    }

    function entryOpen(EntryQueueLib.Queue storage queue, bytes32 entryId)
        internal
        returns (bool)
    {
        EntryQueueLib.Entry entry = queue.entries[entryId];
        return (entry.ids.id != 0 && entry.filled == false);
    }

    /**
     * @dev Remove given entries from each Queue.
     * @return true if both removed
     *         false if either entry doesn't exist or isn't open
     */
    function remove(
        bytes32 _etherEntryId,
        bytes32 _dollarEntryId
    )
        external
        fromDollarToken
        returns (bool)
    {
        if (entryOpen(etherQueue, _etherEntryId) == false ||
            entryOpen(dollarQueue, _dollarEntryId) == false) {
            return false;
        }
        etherQueue.remove(_etherEntryId);
        dollarQueue.remove(_dollarEntryId);
        EntryRemoved(etherChannel, _etherEntryId);
        EntryRemoved(dollarChannel, _dollarEntryId);
        return true;
    }

    function startQueue()
        external
        onlyOwner
    {
        queueOpen = true;
        QueueStarted();
    }

    function stopQueue()
        external
        onlyOwner
    {
        queueOpen = false;
        QueueStopped();
    }

}
