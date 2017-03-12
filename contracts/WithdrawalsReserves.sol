pragma solidity ^0.4.8;

import "./Owned.sol";
import "./ServicesI.sol";
import "./vendor/MathLib.sol";
import "./vendor/SafeSendLib.sol";

/* Central reserves for all value in flight
 * includes: requested withdrawals (emitter excess), contract values after
 *           dissolution, participant funds before match
 */
contract WithdrawalsReserves is Owned {
    using MathLib for uint;
    using SafeSendLib for address;

    mapping (address => uint) public balances;

    address servicesAddress;

    event Reserve(address participant, uint amount);
    event Withdraw(address participant, uint amount);
    event Transfer(address participant, uint amount);

    function WithdrawalsReserves(address _servicesAddress) {
        servicesAddress = _servicesAddress;
    }

    modifier fromFactory() {
        ServicesI services = ServicesI(servicesAddress);
        address factoryAddress = services.serviceAddress(sha3("Factory"));
        if (msg.sender != factoryAddress) { throw; }
        _;
    }

    function reserve(address _participant) payable {
        uint amount = msg.value;
        balances[_participant] = balances[_participant].safeAdd(amount);

        Reserve(_participant, amount);
    }

    function withdraw() {
        address participant = msg.sender;
        uint amount = balances[participant];

        // re-entry protection
        balances[participant] = 0;

        uint sent = participant.safeSend(amount);

        uint newBalance = amount.flooredSub(sent);
        balances[participant] = newBalance;

        Withdraw(participant, sent);
    }
}
