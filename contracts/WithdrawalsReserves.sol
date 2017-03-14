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
        if (msg.sender != services.factory()) { throw; }
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

    function transfer(
        uint _amount,
        address _from,
        address _contractAddress,
        bytes32 _funcSigHash)
        fromFactory
        returns (uint sent)
    {
        uint originalBalance = balances[_from];

        if (originalBalance < _amount) throw;

        // re-entry protection
        balances[_from] = 0;

        if (!_contractAddress.call.value(_amount)(bytes4(_funcSigHash))) throw;

        uint newBalance = originalBalance.flooredSub(_amount);
        balances[_from] = newBalance;

        Transfer(_from, _amount);
    }
}
