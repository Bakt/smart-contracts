pragma solidity ^0.4.7;

import "./vendor/OraclizeI.sol";

contract ExchangeRate is usingOraclize {

  uint public exchangeRate;
  uint public lastBlock;

  uint public blockDelay; // minimum delay
  uint public reserve; // value the contract should keep

  // TODO exchange rate should probably start "stale" and go stale after a time (for safety)
  event UpdateExchangeRate(uint exchangeRate);

  event Debug(uint step);
  event Price(uint price);
  event Result(bytes32 result);

  function ExchangeRate() {
    Debug(0);
    OAR = OraclizeAddrResolverI(0x6d105a42b36f0a7ef234efcd78692a5623aec231);
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
    Debug(1);
  }

  modifier notTooFrequently() {
    if (lastBlock + blockDelay >= block.number) throw;
    _;
  }

  modifier notExceedingReserve() {
    _;
    if (this.balance < reserve) throw;
  }

  function deposit() payable {
  }

  function __callback(bytes32 id, string result, bytes proof) {
      if (msg.sender != oraclize_cbAddress()) throw;
      uint parsedResult = parseInt(result, 3) * 1000000000000000; //note, 1000000000000000 is (1 ether)/10^3
      if (parsedResult<=0) throw;

      exchangeRate = parsedResult;
      lastBlock = block.number;

      UpdateExchangeRate(exchangeRate);
  }

  function initFetch() /*notTooFrequently() notExceedingReserve()*/ {
      bytes32 result = oraclize_query("URL", "json(https://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd", 300000);
  }
}
