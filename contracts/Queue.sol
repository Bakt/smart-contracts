pragma solidity ^0.4.8;

import "./Owned.sol";
import "./EntryChannel.sol";
import "./EntryQueueLib.sol";
import "./ServicesI.sol";

/**
 * A single market represents a market for entering into a 2 party contract.
 * Two parties, emitter and beneficiary parties are required to open a contract.
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
    event EmitterAdded(address indexed account, bytes32 newEntryId, uint value);
    event EmitterRemoved(bytes32 indexed entryId);
    event BeneficiaryAdded(address indexed account, bytes32 newEntryId, uint value);
    event BeneficiaryRemoved(bytes32 indexed entryId);
    event QueueStarted();
    event QueueStopped();


    /*
     *  Data
     */
    string constant EMITTER_DOLLARTOKEN_FUNCTION = "emitBackingValue(address)";
    string constant BENEFICIARY_DOLLARTOKEN_FUNCTION = "purchaseDollars(address)";

    address public servicesAddress;
    address public dollarToken;             // DollarToken contract
    address public emitterChannel;            // ether guy enters queue here
    address public beneficiaryChannel;           // dollar guy enters queue here

    using EntryQueueLib for EntryQueueLib.Queue;
    EntryQueueLib.Queue emitterQueue;
    EntryQueueLib.Queue beneficiaryQueue;

    bool queueOpen;                         // flag allows queue to be stopped in case of emergency


    /*
     *  Modifiers
     */
    modifier fromDollarToken() {
         if (msg.sender != dollarToken) { throw; }
         _;
     }

    modifier fromChannel() {
        if (msg.sender != emitterChannel && msg.sender != beneficiaryChannel) { throw; }
        _;
    }

     modifier isOpen() {
         if (queueOpen == false) { throw; }
         _;
     }


    /*
     *  Functions
     */

    function Queue(address _servicesAddress) {
        ServicesI services = ServicesI(_servicesAddress);
        setDollarToken(services.dollarToken());
        emitterChannel = new EntryChannel(dollarToken, EMITTER_DOLLARTOKEN_FUNCTION);
        beneficiaryChannel = new EntryChannel(dollarToken, BENEFICIARY_DOLLARTOKEN_FUNCTION);
        emitterQueue.init();
        beneficiaryQueue.init();
        queueOpen = true;
    }

    /**
     * @dev Change the DollarToken contract address

     * NOTE: caller would also need to update the EntryChannel receivers.
     * TODO: look at updating EntryChannels here in the same transaction or even
     *          changing to use a service registry or similar.
     */
    function setDollarToken(address _dollarToken)
        onlyOwner
    {
        dollarToken = _dollarToken;
    }

    function addEmitter(address _account, uint _amount)
        external
        isOpen
        fromDollarToken
        returns (bytes32 entryId)
    {
        addEmitterInternal(_account, _amount, true);
    }

    function addEmitterToHead(address _account, uint _amount)
        external
        isOpen
        fromDollarToken
        returns (bytes32 entryId)
    {
        addEmitterInternal(_account, _amount, false);
    }

    function addEmitterInternal(address _account, uint _amount, bool toTail)
        internal
        returns (bytes32 entryId)
    {
        // TODO: add a nonce - what if _account creates 2 entries for the same value in the same block?
        entryId = sha3("emitter", _account, _amount, block.number);
        if (toTail) {
            emitterQueue.pushTail(entryId, _account, _amount);
        } else {
            emitterQueue.pushHead(entryId, _account, _amount);
        }
        EmitterAdded(_account, entryId, _amount);
    }

    function addBeneficiary(address _account, uint _amount)
        external
        isOpen
        fromDollarToken
        returns (bytes32 entryId)
    {
        addBeneficiaryInternal(_account, _amount, true);
    }

    function addBeneficiaryToHead(address _account, uint _amount)
        external
        isOpen
        fromDollarToken
        returns (bytes32 entryId)
    {
        addBeneficiaryInternal(_account, _amount, false);
    }

    function addBeneficiaryInternal(address _account, uint _amount, bool toTail)
        internal
        returns (bytes32 entryId)
    {
        // TODO: add a nonce - what if _account creates 2 entries for the same value in the same block?
        entryId = sha3("beneficiary", _account, _amount, block.number);
        if (toTail) {
            beneficiaryQueue.pushTail(entryId, _account, _amount);
        } else {
            beneficiaryQueue.pushHead(entryId, _account, _amount);
        }
        BeneficiaryAdded(_account, entryId, _amount);
    }

    function getEntryEmitter(bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        return emitterQueue.get(_entryId);
    }

    function getEntryBeneficiary(bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        return beneficiaryQueue.get(_entryId);
    }

    function getOpenEmitter()
        constant
        returns (bytes32[] ids)
    {
        return emitterQueue.getOpen();
    }

    function getOpenBeneficiary()
        constant
        returns (bytes32[] ids)
    {
        return beneficiaryQueue.getOpen();
    }

    function lengthEmitter()
        constant
        returns (uint length)
    {
        length = emitterQueue.length;
    }

    function lengthBeneficiary()
        constant
        returns (uint length)
    {
        length = beneficiaryQueue.length;
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
        bytes32 _emitterEntryId,
        bytes32 _beneficiaryEntryId
    )
        external
        fromDollarToken
        returns (bool)
    {
        if (entryOpen(emitterQueue, _emitterEntryId) == false ||
            entryOpen(beneficiaryQueue, _beneficiaryEntryId) == false) {
            return false;
        }
        emitterQueue.remove(_emitterEntryId);
        beneficiaryQueue.remove(_beneficiaryEntryId);
        EmitterRemoved(_emitterEntryId);
        BeneficiaryRemoved(_beneficiaryEntryId);
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
