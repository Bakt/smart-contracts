import "OraclizeI";

contract ExchangeRate is usingOraclize {

  public uint exchangeRate;
  public uint lastBlock;

  public uint blockDelay; // minimum delay
  public uint reserve; // value the contract should keep

  event UpdateExchangeRate(uint exchangeRate);


  function ExchangeRate() {
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
  }

  modifier notTooFrequently() {
    if (lastBlock + blockDelay >= block.number) throw;
    _;
  }

  modifier notExceedingReserve() {
    _;
    if (startBalance - this.balance > reserve) throw;
  }

  function __callback(bytes32 id, string result, bytes proof) {
      if (msg.sender != oraclize_cbAddress()) throw;
      uint parsedResult = parseInt(result, 3) * 1000000000000000; //note, 1000000000000000 is (1 ether)/10^3
      if (parsedResult<=0) throw;

      exchangeRate = parsedResult;
      lastBlock = block.number;

      UpdateExchangeRate(exchangeRate);
  }

  function initFetch() notTooFrequently() notExceedingReserve() {
      oraclize_query("URL", "json(http://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd", 300000);
  }
}
