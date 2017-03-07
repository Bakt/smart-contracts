// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css"

import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

import queueJSON from '../../build/contracts/Queue.json'
var Queue = contract(queueJSON)

var accounts
var account

window.App = {
  start: function() {
    var self = this

    // Bootstrap the Queue abstraction for Use.
    Queue.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.")
        return
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]

      self.refreshBalance()
    })
  },

  setStatus: function(message) {
    var status = document.getElementById("status")
    status.innerHTML = message
  },

  refreshLengths: function() {
    var self = this

    var queue
    Queue.deployed().then(function(instance) {
      queue = instance
      return queue.lengthEmitter.call()
    }).then(function(value) {
      var lenEl = document.getElementById("emit-length")
      lenEl.innerHTML = value.valueOf()
      return queue.lengthBeneficiary.call()
    }).then(function(value) {
      var lenEl = document.getElementById("bene-length")
      lenEl.innerHTML = value.valueOf()
    }).catch(function(e) {
      console.log(e)
      self.setStatus("Error getting lengths see log.")
    })
  }
}

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 Queue, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-queuemask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-queuemask")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
  }

  App.start()
})
