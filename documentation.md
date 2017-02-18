Documentation // Ethereum Dollar Token                             
authors: felix@veon.industries | nick@veon.industries

![](https://i.imgur.com/JFUDrMe.png)

Download parity (against Ropsten) for live testing. 
Run <C:\Program Files\Ethcore\Parity>parity.exe --testnet --warp in terminal.

![](https://i.imgur.com/YcGW0J8.png)

After snapshots are completed downloading open the browser: http://localhost:8080

1. Manually create new accounts called Beneficiary and Emitter using “New Account”.

![](https://i.imgur.com/ISZz1qF.png)

2. Visit http://faucet.ropsten.be:3001 to send 1 test ether to each account.

3. Go to “Settings” and add Contracts to the menu by selecting it.

![](https://i.imgur.com/NRIFISt.png)

Then navigate to the “Contracts” tab and click “Watch Contract”, “Custom Contract”.
4. Firstly copy the Exchange Rate address and abi into the below form using this link.
https://gist.github.com/gnidan/a553a16bb2bb931ec2b840d66ecf6df0 

![](https://i.imgur.com/nZpEiSE.png)

Click into the ExchangeRateContract and call the initFetch() function to retrieve the pricefeed via Oracalize. This will give the latest price from Etherscan.io 

![](https://i.imgur.com/bSHFS9k.png)

For the purposes of making numbers easier in the demonstration given in this documentation, we have set the price manually ourselves to $10.

Note: When the cron job is active to set the price automatically on a time schedule, we can use TLS proofs built into Oraclize to verify that the pricefeed is being set by the EtherscanAPI and not by ourselves.  

For more information: https://docs.oraclize.it/#security

Next, repeat same “Watch Contract” steps for BackedValueContract Factory.

![](https://i.imgur.com/bsdXiqJ.png)

Click into BVC Factory and click “Execute”

![](https://i.imgur.com/TQEX8sR.png)
Select beneficiary address and supply the beneficiary address as indicated.
100 notional cents is equal to $1.00.


If not enough ETH is sent to back the nominal cents value, then the contract will remain in pending state, and the emitter will either be allowed to withdraw (cancel), or send more.

Once you have posted the transaction, navigate to "Contracts" -> "BVC Factory" to find your tx hash. 

![](https://i.imgur.com/JHB0dXz.png)

Click on this to be redirected to Etherscan.io which will give you the option to then click on the deployed BVC contract where you will be able to copy this address.

![](https://i.imgur.com/NJhT1iR.png)

Copy this address into the “Watch Contract” -> “Custom Contract” along with the BVC Contract ABI located here:

![](https://i.imgur.com/cH5SNZz.png)

Click into the BVC Contract to find the details of the agreement between the beneficiary and emitter. 

![](https://i.imgur.com/xoOQYH6.png)

/* allowedBeneficiaryWithdrawl */

This is notional value in cents.

/* allowedEmitterWithdrawl */

Assuming $10 ETH.
100 notional cents must be covered by 0.2 ETH (200 cents)
Using a Margin Ratio of 1 (100% margin value)

0.5 ETH (balance) - 0.2 ETH (backing value + 100% margin) 

= 0.3ETH excess.

/* currentMargin */

The current margin represents the ratio of the total contract value to the current notional value in ETH.

currentMargin = 4.0 

Because 0.5ETH in contract ($5.00) - 1 (100% margin value)

1 = Margin Ratio representative of (i.e $2 to cover $1)

/* currentState */

Either "Active" or "Pending".
Pending: Requires more ETH from the Emitter to initiate the contract.
Active: Contract is operational.

/* notionalCents */ 

Publically displays value of USD that beneficiary is entitled to.

/* pendingNotionalCents */  

If not enough ETH is sent to cover the notionalCents value.
It temporarily stores the notionalCents value until enough ETH is sent.

Below you can see how it is possible for both the emitter and the beneficiary to withdraw either cents(dollars) or wei(ether) accordingly.

From the perspective of the Benficiary:

![](https://i.imgur.com/zzlF8zq.png)

And from the perspective of the Emitter:

![](https://i.imgur.com/kyDpdba.png)

Note: We have two seperate functions for withdrawls. One that allows only the full amount to be withdrawn at one time.

The other allowing for partial withdrawls to be made possible if necessary.

The entire tx history of this contract can be viewed at:
https://testnet.etherscan.io/address/0xaa402cbd1e05d8443244ce5d0f7adeef8dd072f1#internaltx

