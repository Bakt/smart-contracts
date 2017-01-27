import "./vendor/OraclizeI.sol";

contract ExchangeRate is usingOraclize {

  uint public exchangeRate;
  uint public lastBlock;

  uint public blockDelay; // minimum delay
  uint public reserve; // value the contract should keep

  // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
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
    if (this.balance < reserve) throw;
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
