pragma solidity ^0.4.7;

import "./vendor/MathLib.sol";
import "./vendor/SafeSendLib.sol";

import "./ExchangeRate.sol";
import "./ServicesI.sol";

contract BackedValueContract {
    using MathLib for uint;
    using SafeSendLib for address;

    address public emitter;
    address public beneficiary;

    enum State {
        Pending, Active
    }

    State state = State.Pending;

    event Active();

    event Deposit(uint weiDeposited);
    event BeneficiaryWithdrawal(
        uint centsWithdrawn,
        uint weiValue,
        uint weiPerCent
    );
    event EmitterWithdrawal(uint weiWithdrawn);

    // balance of contract is value on chain
    uint public notionalCents;
    uint public pendingNotionalCents;

    // withdrawal balances?

    ServicesI services;

    uint INITIAL_MINIMUM_MARGIN_RATIO = 2;

    function BackedValueContract(address _servicesAddress,
                                 address _emitter,
                                 address _beneficiary,
                                 uint _notionalCents)
    {
        services = ServicesI(_servicesAddress);

        emitter = _emitter;
        beneficiary = _beneficiary;
        pendingNotionalCents = _notionalCents;
    }

    function () { }

    function deposit() payable {
    }

    function activate()
        withEnoughWei
        whenPending
    {
        notionalCents = pendingNotionalCents;
        pendingNotionalCents = 0;
        state = State.Active;
        Active();
    }


    /*
     * Constant Functions
     */

    function allowedEmitterWithdrawal() constant returns (uint weiValue) {
        ExchangeRate exchangeRate = ExchangeRate(services.exchangeRate());
        uint lockedValue = INITIAL_MINIMUM_MARGIN_RATIO
            .safeMultiply(notionalCents)
            .safeMultiply(exchangeRate.weiPerCent());

        return this.balance.flooredSub(lockedValue);
    }

    function allowedBeneficiaryWithdrawal() constant returns (uint centsValue) {
        return notionalCents;
    }

    function currentState() constant returns (string) {
        if (state == State.Pending) {
            return "pending";
        } else if (state == State.Active) {
            return "active";
        } else {
            return "";
        }
    }

    function currentMargin() constant returns (uint) {
        // 1 * 10**18 = 100% margin on notional value
        ExchangeRate exchangeRate = ExchangeRate(services.exchangeRate());

        uint divisionDecimals = 2;
        uint margin = (
            this.balance.safeMultiply(10**divisionDecimals) /
                notionalCents.safeMultiply(exchangeRate.weiPerCent())
            - 10**divisionDecimals
        );

        return margin.safeMultiply(10 ** (18-divisionDecimals));
    }


    /*
     * Withdrawal Logic
     */

    function withdraw() onlyParticipants returns (bool) {
        // beneficiary may withdraw what they are owed
          // when beneficiary withdraws, set notionalCents = 0
        // emitter may withdraw any amount in excess of that

        uint weiWithdrawal;
        uint centsWithdrawal;
        if (msg.sender == emitter) {
            weiWithdrawal = allowedEmitterWithdrawal();
            return withdraw(weiWithdrawal);
        } else if (msg.sender == beneficiary) {
            centsWithdrawal = allowedBeneficiaryWithdrawal();
            return withdraw(centsWithdrawal);
        }
    }

    function withdraw(uint weiOrCents) onlyParticipants returns (bool) {
        if (msg.sender == emitter) {
            withdrawToEmitter(weiOrCents);
        } else if (msg.sender == beneficiary) {
            withdrawToBeneficiary(weiOrCents);
        }
    }

    function withdrawToBeneficiary(uint centsValue)
        internal
        returns (bool)
    {
        // withdraw behavior:
        // 0. beneficiary asks for cents
        // 1. withdraw() asserts requested cents <= notionalValue
        // 2. withdraw() calculates wei equivalent
        // 3. withdraw() sends wei to beneficiary
        ExchangeRate exchangeRate = ExchangeRate(services.exchangeRate());

        uint weiPerCent = exchangeRate.weiPerCent();
        uint weiEquivalent = centsValue.safeMultiply(weiPerCent);

        if (centsValue > allowedBeneficiaryWithdrawal()) {
            throw;
        }

        // re-entrance protection.
        uint priorNotionalCents = notionalCents;
        notionalCents = 0;
        uint sentWei = beneficiary.safeSend(weiEquivalent);
        notionalCents = priorNotionalCents.flooredSub(centsValue);

        BeneficiaryWithdrawal(centsValue, sentWei, weiPerCent);
        return (sentWei > 0);
    }

    function withdrawToEmitter(uint weiValue)
        internal
        returns (bool)
    {
        if (weiValue > allowedEmitterWithdrawal()) {
            throw;
        }

        uint sentWei = emitter.safeSend(weiValue);

        EmitterWithdrawal(sentWei);
        return (sentWei > 0);
    }



    /*
     * Modifiers
     */

    modifier onlyParticipants() {
        if (msg.sender == emitter || msg.sender == beneficiary) _;
    }


    modifier whenPending() {
        if (state == State.Pending) _;
    }

    modifier withEnoughWei() {
        // exchangeRate    wei / cent
        // msg.value       wei
        //
        // maximum notional value:
        // exchangeRate / msg.value / INITIAL_MARGIN_REQUIREMENT :: cents
        //
        uint providedWei = this.balance;
        uint weiPerCent = ExchangeRate(services.exchangeRate()).weiPerCent();
        uint providedCents = providedWei / weiPerCent;
        uint maximumNotionalCents = providedCents / INITIAL_MINIMUM_MARGIN_RATIO;

        if (pendingNotionalCents <= maximumNotionalCents) {
            _;
        }
    }
}
