pragma solidity ^0.4.7;

import "./OraclizeFacade.sol";
import "./vendor/OraclizeI.sol";

contract BridgedOraclizeFacade is usingOraclize, OraclizeFacade {
    function BridgedOraclizeFacade(address _oar) {
        if (_oar != 0x0) {
          OAR = OraclizeAddrResolverI(_oar);
        }

    }
}
