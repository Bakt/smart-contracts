pragma solidity ^0.4.8;

import "./Owned.sol";
import "./Factory.sol";
import "./ContractStore.sol";
import "./ExchangeRate.sol";
import "./Queue.sol";
import "./ServicesI.sol";

contract DollarToken is Owned {

    /*
     *  Events
     */
    event ContractCreated(address newContract, uint notionalValue);


    /*
     *  Data
     */
    address public servicesAddress;
    address public contractStore;
    address public factory;
    address public exchangeRate;
    address public queue;
    address public matcher;         // authorized match maker


    /*
     *  Modifiers
     */
    modifier fromMatcher() {
        if (msg.sender != matcher) { throw; }
        _;
    }

    modifier fromEmitterChannel() {
        if (msg.sender != Queue(queue).emitterChannel()) { throw; }
        _;
    }

    modifier fromBeneficiaryChannel() {
        if (msg.sender != Queue(queue).beneficiaryChannel()) { throw; }
        _;
    }

    /*
     *  Functions
     */

    function DollarToken(address _servicesAddress) {
        servicesAddress = _servicesAddress;
        ServicesI services = ServicesI(_servicesAddress);
        contractStore = services.serviceAddress(sha3("ContractStore"));
        factory = services.serviceAddress(sha3("Factory"));
        exchangeRate = services.serviceAddress(sha3("ExchangeRate"));
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

    function emitBackingValue(address _emitterAddr)
        external
        payable
        fromEmitterChannel
    {
        // TODO:
        //  receiveFee
        //  allowWithdrawal
        Queue(queue).addEmitter(_emitterAddr, msg.value);
    }

    function purchaseDollars(address _beneficiaryAddr)
        external
        payable
        fromBeneficiaryChannel
    {
        // TODO:
        //  receiveFee
        //  allowWithdrawal
        Queue(queue).addBeneficiary(_beneficiaryAddr, msg.value);
    }

    /**
     * @dev Draw up a new contract between 2 entries and remove entries from the queues.
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

        var (beneAccount, beneValue, ) = Queue(queue).getEntryBeneficiary(_beneficiaryEntryId);
        var (emitAccount, emitValue, ) = Queue(queue).getEntryEmitter(_emitterEntryId);

        // Contract value is the lowest of the 2
        uint valueUnrounded = (emitValue > beneValue) ?
                                    beneValue : emitValue;

        // Round to dollar and calculate
        uint weiDollar = ExchangeRate(exchangeRate).weiPerCent() * 100;
        uint notionalValue = (valueUnrounded / weiDollar) * weiDollar;
        uint valueTotal = notionalValue * 2;

        /* WILL BE REPLACED WITH WITHDRAW PATTERN AND WITHDRAW CONTRACT */

        /*// refund differences
        if (!emitAccount.account.send(emitValue - notionalValue)) {
            throw;
        }
        if (!beneAccount.send(beneValue - notionalValue)) {
            throw;
        }*/

        // Create contract:
        newContract = Factory(factory).createBackedValueContract.value(valueTotal)(
             emitAccount,
             beneAccount,
             notionalValue
        );
        ContractCreated(newContract, notionalValue);
        ContractStore(contractStore).add(newContract);
    }

    /**
     * Internal functions
     */
    function serviceAddress(string name)
        constant
        internal
        returns (address)
    {
        return ServicesI(servicesAddress).serviceAddress(sha3(name));
    }
}
