pragma solidity ^0.4.8;

import "./Owned.sol";
import "./EntryChannel.sol";
import "./EntryQueueLib.sol";
import "./FactoryStub.sol";
import "./ContractStore.sol";
import "./ExchangeRateStub.sol";

/**
 * A single market represents a market for entering into a 2 party contract.
 * Two parties, dollar and an ether party are required to open a contract.
 * Parties enter a contract by first sending ether to an EntryChannel which
 * results in an entry on a corresponding Queue.
 *
 * Entries sit in the Queues waiting for a match with an opposing entry.
 * An offchain process called the matcher draws up a contract when it finds a
 * match between 2 parties in a market.
 */
contract Queue is Owned {

    /*
     *  Events
     */
    event MarketAdded(uint indexed marketId, string name, address etherChannel, address dollarChannel);
    event MarketStopped(uint indexed marketId);
    // use this event to look up all entries for an account
    event EntryAdded(uint indexed marketId, address indexed channel, address indexed account, bytes32 newEntryId, uint value);
    event EntryRemoved(uint indexed marketId, address indexed channel, bytes32 indexed entryId);
    event ContractCreated(uint indexed marketId, address newContract, uint notionalValue);


    /*
     *  Data
     */
    struct Market {
        uint id;
        string name;
        bool open;
        address etherChannel;           // ether guy enters queue here
        address dollarChannel;          // dollar guy enters queue here
    }

    uint lastMarket = 0;

    // market id to market
    mapping (uint => Market) markets;

    // map of channels back to market ids
    mapping (address => uint) channelToMarket;

    // channel address -> Queue of Entries
    using EntryQueueLib for EntryQueueLib.Queue;
    mapping (address => EntryQueueLib.Queue) queues;

    address public matcher;             // authorized match maker
    address public contractStore;
    address public factory;
    address public exRate;


    /*
     *  Modifiers
     */
    modifier isMatcher() {
         if (msg.sender != matcher) { throw; }
         _;
     }

    modifier registeredChannelAndMarketOpen() {
        if (markets[channelToMarket[msg.sender]].open != true) { throw; }
        _;
    }


    /*
     *  Functions
     */

    function Queue(address _contractStore, address _factory, address _exRate) {
        contractStore = _contractStore;
        factory = _factory;
        exRate = _exRate;
        setMatcher(msg.sender);  // for now just make the matcher the creater
    }

    function setMatcher(address _newMatcher)
        onlyOwner
    {
        matcher = _newMatcher;
    }

    function createEntry(address _account)
        external
        payable
        registeredChannelAndMarketOpen
        returns (bytes32 entryId)
    {
        address channel = msg.sender;
        uint marketId = channelToMarket[channel];
        entryId = sha3(marketId, channel, _account, msg.value, block.number);

        EntryQueueLib.Queue queue = queues[channel];
		queue.pushTail(entryId, _account, msg.value);

        EntryAdded(marketId, channel, _account, entryId, msg.value);
    }

    function getEntryEtherGuy(uint _marketId, bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        Market market = markets[_marketId];
        return queues[market.etherChannel].get(_entryId);
    }

    function getEntryDollar(uint _marketId, bytes32 _entryId)
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        Market market = markets[_marketId];
        return queues[market.dollarChannel].get(_entryId);
    }

    function getOpenEtherGuy(uint _marketId)
        constant
        returns (bytes32[] ids)
    {
        Market market = markets[_marketId];
        return queues[market.etherChannel].getOpen();
    }

    function getOpenDollar(uint _marketId)
        constant
        returns (bytes32[] ids)
    {
        Market market = markets[_marketId];
        return queues[market.dollarChannel].getOpen();
    }

    function lengthEtherGuy(uint _marketId)
        constant
        returns (uint length)
    {
        Market market = markets[_marketId];
        length = queues[market.etherChannel].length;
    }

    function lengthDollar(uint _marketId)
        constant
        returns (uint length)
    {
        Market market = markets[_marketId];
        length = queues[market.dollarChannel].length;
    }

    function entryOpen(EntryQueueLib.Queue storage queue, bytes32 entryId)
        internal
        returns (bool)
    {
        EntryQueueLib.Entry entry = queue.entries[entryId];
        return (entry.ids.id != 0 && entry.filled == false);
    }

    /*
     *  Market Functions
     */

    function addMarket(string _name)
        external
        onlyOwner
        returns (uint newMarketId)
    {
        newMarketId = ++lastMarket;

        EntryChannel etherChannel = new EntryChannel(this);
        EntryChannel dollarChannel = new EntryChannel(this);

        channelToMarket[etherChannel] = newMarketId;
        channelToMarket[dollarChannel] = newMarketId;

        queues[etherChannel].init();
        queues[dollarChannel].init();

        markets[newMarketId] = Market(newMarketId, _name, true, etherChannel, dollarChannel);
        MarketAdded(newMarketId, _name, etherChannel, dollarChannel);
    }

    function getMarket(uint _marketId)
        constant
        returns (
            string name,
            address etherChannel,
            address dollarChannel,
            bool open
        )
    {
        Market market = markets[_marketId];
        name = market.name;
        etherChannel = market.etherChannel;
        dollarChannel = market.dollarChannel;
        open = market.open;
    }

    function stopMarket(uint _marketId)
        external
        onlyOwner
    {
        markets[_marketId].open = false;
    }

    /*
     * Draw up a new contract between 2 entries and remove entries from the queues.
     */
    function drawContract(
        uint _marketId,
        bytes32 _etherEntryId,
        bytes32 _dollarEntryId
    )
        external
        isMatcher
        returns (address newContract)
    {
        Market market = markets[_marketId];
        EntryQueueLib.Queue eQueue = queues[market.etherChannel];
        EntryQueueLib.Queue dQueue = queues[market.dollarChannel];

        if (
            entryOpen(eQueue, _etherEntryId) == false ||
            entryOpen(dQueue, _dollarEntryId) == false
        ) {
            throw;
        }

        EntryQueueLib.Entry etherEntry = eQueue.entries[_etherEntryId];
        EntryQueueLib.Entry dollarEntry = dQueue.entries[_dollarEntryId];

        // Contract value is the lowest of the 2
        uint valueUnrounded = (etherEntry.value > dollarEntry.value) ?
                                    dollarEntry.value : etherEntry.value;

        // Round to dollar and calculate
        uint weiDollar = ExchangeRateStub(exRate).weiPerCent() * 100;
        uint notionalValue = (valueUnrounded / weiDollar) * weiDollar;
        uint valueTotal = notionalValue * 2;

        // refund differences
        if (!etherEntry.account.send(etherEntry.value - notionalValue)) {
            throw;
        }
        if (!dollarEntry.account.send(dollarEntry.value - notionalValue)) {
            throw;
        }

        // Create contract:
        newContract = FactoryStub(factory).createBackedValueContract.value(valueTotal)(
             etherEntry.account,              // emitter
             dollarEntry.account,             // beneficiary
             notionalValue
        );
        ContractCreated(_marketId, newContract, notionalValue);

        ContractStore(contractStore).add(newContract);

        eQueue.remove(_etherEntryId);
        dQueue.remove(_dollarEntryId);
        EntryRemoved(_marketId, market.etherChannel, _etherEntryId);
        EntryRemoved(_marketId, market.dollarChannel, _dollarEntryId);
    }

}
