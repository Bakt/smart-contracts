import "./ExchangeRate.sol";



contract BackedValueContract {
  address public emitter;
  address public beneficiary;

  // balance of contract is value on chain
  uint public notionalValue;

  // withdrawal balances?

  ExchangeRate exchangeRate;

  uint public constant warningThreshold = 0.1 ether * notionalValue;

  enum State {
    Solvent,
    Warning,
    Insolvent
  }

  event NowSolvent(uint solvency);
  event NowWarning(uint solvency);
  event NowInsolvent();

  State public solvencyState;

  function BackedValueContract(address _beneficiary, uint _notionalValue,
                               address _exchangeRateAddress) {
    emitter = msg.sender;
    beneficiary = _beneficiary;
    notionalValue = _notionalValue;

    exchangeRate = ExchangeRate(_exchangeRateAddress);
  }

  modifier onlyParticipants() {
    if (msg.sender == emitter || msg.sender == beneficiary) _;
  }

  function getSolvency() constant returns (uint) {
    return this.balance - (notionalValue / exchangeRate.exchangeRate());
  }

  function getCurrentState() constant internal returns (State) {
    var excess = getSolvency();
    if (excess > warningThreshold) {
      return State.Solvent;
    } else if (excess > 0) {
      return State.Warning;
    } else {
      return State.Insolvent;
    }
  }

  function onStateChange() /*onlyOnChangedState*/ internal {
    var enteredState = getCurrentState();
    var solvency = getSolvency();

    if (enteredState == State.Solvent) {
      NowSolvent(solvency);
      // onEnterSolvent()
    } else if (enteredState == State.Warning) {
      NowWarning(solvency);
      // onEnterWarning();
    } else if (enteredState == State.Insolvent) {
      NowInsolvent();
      onEnterInsolvent();
    }
  }

  function onEnterInsolvent() internal {
  }

  function withdraw() onlyParticipants(){
    // beneficiary may withdraw what they are owed
    // emitter may withdraw any amount in excess of that
  }

  function () payable {
    // emitter can pay into value in case of margin decrease
  }

}
