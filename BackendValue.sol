import "./ExchangeRate";



contract BackedValueContract {
  public address emitter;
  public address beneficiary;

  // balance of contract is value on chain
  public uint notionalValue;

  // withdrawal balances?

  ExchangeRate exchangeRate;

  public constant uint warningThreshold = 0.1 ether * notionalValue;


  enum SolvencyState {
    Solvent,
    Warning,
    Insolvent
  }



  public SolvencyState solvencyState;

  function BackedValueContract(address _beneficiary, uint _notionalValue,
                               address _exchangeRateAddress)
                            fetchesExchangeRate() {
    emitter = msg.sender;
    beneficiary = _beneficiary;
    notionalValue = _notionalValue;

    exchangeRate = ExchangeRate(_exchangeRateAddress);
  }

  modifier fetchesExchangeRate() {
    _;
    exchangeRate.initFetchExchangeRate.call();

  }

  modifier onlyParticipants() {
    if (msg.sender == emitter || msg.sender == beneficiary) _;
  }

  function getSolvency() constant returns (uint) {
    return this.balance - (notionalValue / exchangeRate.exchangeRate);
  }

  function getCurrentState() constant internal returns (SolvencyState) {
    var excess = getSolvency();
    if (excess > warningThreshold) {
      return Solvent;
    } else if (excess > 0) {
      return Warning;
    } else {
      return Insolvent;
    }
  }

  function onStateChange() onlyOnChangedState internal {
    var enteredState = getCurrentState();
    var solvency = getSolvency();

    if (enteredState == Solvent) {
      NowSolvent(solvency);
      // onEnterSolvent()
    } else if (enteredState == Warning) {
      NowWarning(solvency);
      // onEnterWarning();
    } else if (enteredState == Insolvent) {
      NowInsolvent();
      onEnterInsolvent();
    }
  }

  function onEnterInsolvent() internal {
    beneficiaryOwed = //
  }

  function withdraw() onlyParticipants(){
    // beneficiary may withdraw what they are owed
    // emitter may withdraw any amount in excess of that
  }

  function () payable {
    // emitter can pay into value in case of margin decrease
  }

}
