'use strict'

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css"

import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// const SERVICES_ADDR = "0x60b1a811f5ea71806bb3bc0e5b74920eeae91913"
//
// import servicesJSON from '../../build/contracts/Services.json'
// const Services = contract(servicesJSON)

// TODO: get this from services:
const QUEUE_ADDR = "0x693f5b3a5d25db8c0c78b4e8f5f27026a820485f"
import queueJSON from '../../build/contracts/Queue.json'
const Queue = contract(queueJSON)

let queue
let accounts
let account

window.App = {
  start: function() {
    let self = this

    // Bootstrap the Queue abstraction for Use.
    // Services.setProvider(web3.currentProvider)
    Queue.setProvider(web3.currentProvider)
    Queue.at(QUEUE_ADDR).then((instance) => {
        queue = instance

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

          self.refreshAll()
        })
    })
    // Get the initial account balance so it can be displayed.
  },

  refreshAll: function() {
    queue.lengthEmitter.call().then((value) => {
      let lenEl = document.getElementById("emit-length")
      lenEl.innerHTML = value.valueOf()
      return queue.lengthBeneficiary.call()
  }).then((value) => {
      let lenEl = document.getElementById("bene-length")
      lenEl.innerHTML = value.valueOf()
    }).catch(function(e) {
      console.log(e)
      alert(e)
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
