    function updateExchangeRate() payable {
        var startBalance = this.balance;
        oraclize_query("URL", "json(http://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd", 300000);
        if (startBalance - this.balance > msg.value) throw;
    }
