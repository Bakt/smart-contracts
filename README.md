# dollar_token

First let me introduce the two players involved in this contract: - on the one hand the Ether person (aka emitter) who believes that the value of ETH will grow in price over time - on the other hand the Dollar person (aka the beneficiary) who is only interested in keeping an asset on the blockchain worth $1, regardless of the fluctuation of the crypto-currency.

A contract is created by the Ether person (the emitter) who will fund it with $2 worth of Ether. $1 will be used for the notional value of the contract (what the beneficiary will receive no matter what happens) and $1 will be used as a margin to cover for the ETH fluctuations On the other side, the Dollar person (the beneficiary) will pay $1 for this contract and will be guaranteed to receive $1 back no matter what happens.

There are therefore two addresses attached to this account and several events can happen during the lifetime of this contract.

1) the USD_ETH conversion rate goes dowm If the value of ETH goes down, the $1 kept for margin will be used to cover the difference. The contract will remain intact until the margin reaches $0.10 worth of ETH. At this point the emitter will have the option to replenish the margin with more ETH or the contract will be unwound. If the contract is unwound beneficary will receive $1 worth of ETH and the emitter will receive the remainder of the margin (i.e. more or les $0.10 worth of ETH)

Option 2: the USD_ETH conversion rate goes up The emitter now has more than $2 invested in this contract. He can ask for the delivery whatever is in excess of the $1 required to cover the margin. For example, let's say the amount of ETH contained in the contract is now worth $2.5, the emitter can ask for the immediate delivery of $0.50 and keep the contract intact with $1 of margin funds.

Option 3: the USD_ETH remains within a stable range. Both parties don't have to do anything until either party wants to recover their money. At this point the contract can either be unwound (funds are released to both parties: $1 worth of ETH to the beneficary and the remainder of the margin to the emitter) or they can be sold by either party in a way that would change the address of the emitter or the beneficiary. We could even think of a separate contract that would act as a decentralized exchange where these dollar contracts can change hands but that's a discussion for another day.

So to summarize here's what needs to be done:
1) The emitter creates a contract containing $2 worth of ether (or more)
2) The beneficiary needs to be receiving $1 no matter what happens. SO there is $1 allocated to the notional value of the contract and the remainder user for the margin
3) The USDT_ETH is checked on a regular basis to ensure that there is still $1 and to calculate the margin left (whatever is greater than $1)
4) Either party can unwind the contract at any time: the beneficiary receives $1 worth of ETH and the emitter receives the rest
5) If the margin is greater than $1 (i.e. the total balance is greater than $2) then the emitter can withdraw whatever is greater than $2. Similarly, the emitter can add funds to the contract and replenish the margin: let's say there is only $0.50 left in margin, the emitter can send some funds to make this margin greater
6) If the margin reaches $0.10 then the contract is automatically unwound: the beneficiary receives $1 and the emitter receives whatever balance is left.

Please not that at any time during the contract, the amounts (notional and margin) need to be converted in USD so getting the quote from Poloniex on a regular basis is essential.

1) In a first phase, we would build a prototype that would consist of a $1 contract between two parties. That's it! There would not be exchanges, transferability of the token between one person and the other etc....
None of that fancy stuff. Just a contract between you and me where I would have to put $2 worth of ETH, where you would have a claim of $1 and that would release its value in one of these events:
- if either one of us decide to "get out". In that case, you would get $1 and I would get the remainder in ETH
- if the value of the balance falls below $1.10. In that case, the funds would be released the same way but without requiring a manual intervention
We should also add the possibility for the person on the ETH side (me in that case) to claim anything that would be above $2.

2) In a second phase, we would think about how we could make this a viable token for a larger public. One way would be to hold all the tokens in one big pool, and maintain the liabilities of each one of the parties involved, both in dollars and in ETH. I don't really like this centralized approach as we have seen with the DAO Hack that holding too much money in one single contract makes it a big piniata with a huge prize for whoever can hack it.

So I prefer the decentralized approach.

In my opinion, we could keep the tokens pretty similar to the prototype I just described, only that if someone decides to "get out" of the contract, then it would go in a pool and the counterparty would be automatically replaced by someone else.

-- Summary --

1) We build a simple prototype between two parties

2) We create a contract that would act as some sort of simple exchange. It would just take care of transferring the tokens since there would be no bid/ask (the token is pegged to the dollar)
