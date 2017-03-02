pragma solidity ^0.4.8;

import "./Owned.sol";
import "./FactoryStub.sol";
import "./ContractStore.sol";
import "./ExchangeRateStub.sol";
import "./Queue.sol";

contract DollarToken is Owned {

    /*
     *  Events
     */
    event ContractCreated(address newContract, uint notionalValue);


    /*
     *  Data
     */
    address public matcher;         // authorized match maker
    address public contractStore;
    address public factory;
    address public exchangeRate;
    address public queue;


    /*
     *  Modifiers
     */
    modifier fromMatcher() {
         if (msg.sender != matcher) { throw; }
         _;
     }


    /*
     *  Functions
     */

    function DollarToken(
        address _contractStore,
        address _factory,
        address _exchangeRate,
        address _queue,
        address _matcher)
    {
        setContractStore(_contractStore);
        setFactory(_factory);
        setExchangeRate(_exchangeRate);
        setQueue(_queue);
        setMatcher(_matcher);  // for now just make the matcher the creater
    }

    function setContractStore(address _contractStore)
        onlyOwner
    {
        contractStore = _contractStore;
    }

    function setFactory(address _factory)
        onlyOwner
    {
        factory = _factory;
    }

    function setExchangeRate(address _exchangeRate)
        onlyOwner
    {
        exchangeRate = _exchangeRate;
    }

    function setQueue(address _queue)
        onlyOwner
    {
        queue = _queue;
    }

    function setMatcher(address _matcher)
        onlyOwner
    {
        matcher = _matcher;
    }


    /*
     * Draw up a new contract between 2 entries and remove entries from the queues.
     */
    function emitContract(
        bytes32 _emitterEntryId,
        bytes32 _beneficiaryEntryId
    )
        external
        fromMatcher
        returns (address newContract)
    {
        if (Queue(queue).remove(_emitterEntryId, _beneficiaryEntryId) == false) {
            throw;
        }

        var (dollarAccount, dollarValue, ) = Queue(queue).getEntryBeneficiary(_beneficiaryEntryId);
        var (etherAccount, etherValue, ) = Queue(queue).getEntryEmitter(_emitterEntryId);

        // Contract value is the lowest of the 2
        uint valueUnrounded = (etherValue > dollarValue) ?
                                    dollarValue : etherValue;

        // Round to dollar and calculate
        uint weiDollar = ExchangeRateStub(exchangeRate).weiPerCent() * 100;
        uint notionalValue = (valueUnrounded / weiDollar) * weiDollar;
        uint valueTotal = notionalValue * 2;

        /* WILL BE REPLACED WITH WITHDRAW PATTERN AND WITHDRAW CONTRACT */

        /*// refund differences
        if (!etherAccount.account.send(etherValue - notionalValue)) {
            throw;
        }
        if (!dollarAccount.send(dollarValue - notionalValue)) {
            throw;
        }*/

        // Create contract:
        newContract = FactoryStub(factory).createBackedValueContract.value(valueTotal)(
             etherAccount,              // emitter
             dollarAccount,             // beneficiary
             notionalValue
        );
        ContractCreated(newContract, notionalValue);
        ContractStore(contractStore).add(newContract);
    }

}
