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

    // balance of contract is value on chain
    uint public notionalCents;

    // withdrawal balances?

    ExchangeRate exchangeRate;

    uint INITIAL_MINIMUM_MARGIN_RATIO = 2;

    function BackedValueContract(address _servicesAddress,
                                 address _emitter,
                                 address _beneficiary,
                                 uint _notionalCents)
        ensureBackedValue
        payable
    {
        updateServices(_servicesAddress);

        emitter = _emitter;
        beneficiary = _beneficiary;
        notionalCents = _notionalCents;
    }

    function () payable {
        // emitter can pay into value in case of margin decrease
    }


    /*
     * Constant Functions
     */

    function allowedEmitterWithdrawal() constant returns (uint weiValue) {
        uint lockedValue = INITIAL_MINIMUM_MARGIN_RATIO
            .safeMultiply(notionalCents)
            .safeMultiply(exchangeRate.weiPerCent());

        return this.balance.flooredSub(lockedValue);
    }

    function allowedBeneficiaryWithdrawal() constant returns (uint centsValue) {
        return notionalCents;
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

        uint weiEquivalent = centsValue.safeMultiply(exchangeRate.weiPerCent());

        if (centsValue > allowedBeneficiaryWithdrawal()) {
            throw;
        }

        // re-entrance protection.
        uint priorNotionalCents = notionalCents;
        notionalCents = 0;
        uint sentWei = beneficiary.safeSend(weiEquivalent);
        notionalCents = priorNotionalCents.flooredSub(centsValue);

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

        return (sentWei > 0);
    }



    /*
     * Modifiers
     */

    modifier ensureBackedValue() {
        _;

        // exchangeRate    wei / cent
        // msg.value       wei
        //
        // maximum notional value:
        // exchangeRate / msg.value / INITIAL_MARGIN_REQUIREMENT :: cents
        //
        uint providedWei = msg.value;
        uint weiPerCent = exchangeRate.weiPerCent();

        uint providedCents = providedWei / weiPerCent;

        uint maximumNotionalCents = providedCents / INITIAL_MINIMUM_MARGIN_RATIO;

        if (notionalCents > maximumNotionalCents) throw;
    }

    modifier onlyParticipants() {
        if (msg.sender == emitter || msg.sender == beneficiary) _;
    }


    /*
     * Service Resolution Helper
     */

    function updateServices(address _servicesAddress) internal {
        ServicesI services = ServicesI(_servicesAddress);

        exchangeRate = ExchangeRate(services.EXCHANGE_RATE());
    }
}
