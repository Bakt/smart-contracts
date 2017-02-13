pragma solidity ^0.4.7;

import "contracts/vendor/MathLib.sol";
import "contracts/vendor/SafeSendLib.sol";

import "./ExchangeRate.sol";
import "./ServicesI.sol";

contract BackedValueContract {
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

        // exchangeRate = ExchangeRate(_exchangeRateAddress);
    }

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

    function updateServices(address _servicesAddress) {
        ServicesI services = ServicesI(_servicesAddress);

        exchangeRate = ExchangeRate(services.EXCHANGE_RATE());
    }

    /*
     * Multiplies a by b in a manner that throws an exception when overflow
     * conditions are met.
     */
    function safeMultiply(uint a, uint b) internal returns (uint) {
        var result = a * b;
        if (b == 0 || result / b == a) {
            return a * b;
        } else {
            throw;
        }
    }

    /*
     * Subtracts b from a in a manner such that zero is returned when an
     * underflow condition is met.
     */
    function flooredSub(uint a, uint b) returns (uint) {
        if (b >= a) {
            return 0;
        } else {
            return a - b;
        }
    }

    function allowedEmitterWithdrawal() internal returns (uint weiValue) {
        uint lockedValue = safeMultiply(
            INITIAL_MINIMUM_MARGIN_RATIO, safeMultiply(
                notionalCents, exchangeRate.weiPerCent()
        ));

        return flooredSub(this.balance, lockedValue);
    }

    function allowedBeneficiaryWithdrawal() internal returns (uint centsValue) {
        return notionalCents;
    }

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
            withdrawWei(weiOrCents);
        } else if (msg.sender == beneficiary) {
            withdrawCents(weiOrCents);
        }
    }

    function withdrawCents(uint centsValue) internal returns (bool) {
        // withdraw behavior:
        // 0. beneficiary asks for cents
        // 1. withdraw() asserts requested cents <= notionalValue
        // 2. withdraw() calculates wei equivalent
        // 3. withdraw() sends wei to beneficiary

        uint weiEquivalent = safeMultiply(centsValue, exchangeRate.weiPerCent());

        if (centsValue > 0 && centsValue <= allowedBeneficiaryWithdrawal()) {
            // re-entrance protection.
            notionalCents = 0;
            if (beneficiary.send(weiEquivalent)) {
                notionalCents = flooredSub(
                    notionalCents, weiEquivalent
                );
                return true;
            } else {
                throw;
            }
        }
    }

    function withdrawWei(uint weiValue) internal returns (bool) {
        if (weiValue > 0 && weiValue <= allowedEmitterWithdrawal()) {
            // re-entrance protection.
            // emitter.safeSend(weiValue);
        }

        return true;
    }


  modifier onlyParticipants() {
    if (msg.sender == emitter || msg.sender == beneficiary) _;
  }


  function () payable {
    // emitter can pay into value in case of margin decrease
  }

}
