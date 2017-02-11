pragma solidity ^0.4.7;

import "./vendor/MathLib.sol";

import "./ExchangeRate.sol";
import "./ServicesI.sol";

contract BackedValueContract {
    using MathLib for uint;

    address public emitter;
    address public beneficiary;

    // balance of contract is value on chain
    uint public notionalCents;

    // withdrawal balances?

    ExchangeRate exchangeRate;

    uint INITIAL_MARGIN_REQUIREMENT = 2;

    function BackedValueContract(address _servicesAddress,
                                 address _emitter,
                                 address _beneficiary,
                                 uint _notionalCents) payable {

        updateServices(_servicesAddress);

        emitter = _emitter;
        beneficiary = _beneficiary;
        notionalCents = _notionalCents;

        ensureBackedValue(msg.value);
        // exchangeRate = ExchangeRate(_exchangeRateAddress);
    }

    function ensureBackedValue(uint providedWei) {
        // exchangeRate    wei / cent
        // msg.value       wei
        //
        // maximum notional value:
        // exchangeRate / msg.value / INITIAL_MARGIN_REQUIREMENT :: cents
        //
        uint weiPerCent = exchangeRate.weiPerCent();

        uint providedCents = providedWei / weiPerCent;

        uint maximumNotionalCents = providedCents / INITIAL_MARGIN_REQUIREMENT;

        if (notionalCents > maximumNotionalCents) throw;
    }

    function updateServices(address _servicesAddress) {
        ServicesI services = ServicesI(_servicesAddress);

        exchangeRate = ExchangeRate(services.EXCHANGE_RATE());
    }



  function withdraw() onlyParticipants {
    // beneficiary may withdraw what they are owed
      // when beneficiary withdraws, set notionalValue = 0
    // emitter may withdraw any amount in excess of that

    if (msg.sender == emitter) {
    }
  }

  modifier onlyParticipants() {
    if (msg.sender == emitter || msg.sender == beneficiary) _;
  }


  function () payable {
    // emitter can pay into value in case of margin decrease
  }

}
