'use strict'

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css"

import {default as Web3} from 'web3'
import {default as contract} from 'truffle-contract'

import servicesJSON from '../../build/contracts/Services.json'
import queueJSON from '../../build/contracts/Queue.json'

import config from '../config.json'
const networkConfig = config[config.network]
const endpoint = (networkConfig && networkConfig.endpoint)
    ? (networkConfig.endpoint)
    : "http://localhost:8545"

window.App = {
    start: function() {
        let self = this

        const Services = self.contract(servicesJSON)

        let servicesAddr
        if (networkConfig && networkConfig.services) {
            servicesAddr = networkConfig.services
        } else if (servicesJSON.networks[web3.version.network].address) {
            servicesAddr = servicesJSON.networks[web3.version.network].address
        } else {
            error('no services address - migrate contracts and/or set address in config.json')
            return
        }

        Services.at(servicesAddr).then((inst) => {
            self.services = inst
            return self.serviceAddress('Queue')
        }).then((qAddr) => {
            const Queue = self.contract(queueJSON)
            return Queue.at(qAddr)
        }).then((inst) => {
            self.queue = inst
            web3.eth.getAccounts((err, accs) => {
                if (err != null) {
                    error("There was an error fetching your accounts.")
                    return
                }
                self.accounts = accs
                self.account = accs[0]
                self.refreshAll()
            })
        })
        // Get the initial account balance so it can be displayed.
    },

    refreshAll: function() {
        const self = this
        self.queue.lengthEmitter.call().then((value) => {
            let lenEl = document.getElementById("emit-length")
            lenEl.innerHTML = value.valueOf()
            return self.queue.lengthBeneficiary.call()
        }).then((value) => {
            let lenEl = document.getElementById("bene-length")
            lenEl.innerHTML = value.valueOf()
        }).catch((e) => {
            error(e)
        })
    },

    contract: function(json) {
        const c = contract(json)
        c.setProvider(web3.currentProvider)
        return c
    },

    serviceAddress: function(name) {
        return this.services.serviceAddress.call(web3.sha3(name))
    },

    error: function(msg) {
        console.error(msg)
        alert(msg)
    }

}

window.addEventListener('load', () => {
    // Checking if Web3 has been injected by the browser
    if (typeof web3 !== 'undefined') {
        // Inside a DAPP browser - Mist/MetaMask/Status/etc.
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 Queue, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-queuemask")
        window.web3 = new Web3(web3.currentProvider)
    } else {
        // Not inside a DAPP browser - use hosted server
        console.warn(`No web3 detected. Using backup endpoint ${endpoint}`)
        window.web3 = new Web3(new Web3.providers.HttpProvider(endpoint))
    }

    App.start()
})
