'use strict'

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css"

import {default as contract} from 'truffle-contract'

import servicesJSON from '../../build/contracts/Services.json'
import queueJSON from '../../build/contracts/Queue.json'
import csJSON from '../../build/contracts/ContractStore.json'

import config from '../config.json'
const networkConfig = config[config.network]
const endpoint = (networkConfig && networkConfig.endpoint)
    ? (networkConfig.endpoint)
    : "http://localhost:8545"

window.App = {
    start: function() {
        const self = this

        const Services = self.contract(servicesJSON)

        let servicesAddr
        if (networkConfig && networkConfig.services) {
            servicesAddr = networkConfig.services
        } else if (servicesJSON.networks[web3.version.network].address) {
            servicesAddr = servicesJSON.networks[web3.version.network].address
        } else {
            self.error('no services address - migrate contracts and/or set address in config.json')
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

            return self.serviceAddress('ContractStore')
        }).then((csAddr) => {
            const ContractStore = self.contract(csJSON)
            return ContractStore.at(csAddr)
        }).then((inst) => {
            self.contractStore = inst

            web3.eth.getAccounts((err, accs) => {
                if (err != null) {
                    self.error("There was an error fetching your accounts.")
                    return
                }
                self.accounts = accs
                self.account = accs[0]
                self.refreshAll()
            })
        })

        $('[id^="nav-btn-"]').click(clickChangePage)

        var selectedPage = localStorage.getItem('page')
        if (selectedPage) {
            changePage(selectedPage)
        }
    },

    refreshAll: function() {
        const self = this
        self.displayAccounts(self.accounts)
        self.displayEmitterQueue()
        self.displayBeneficiaryQueue()
        self.displayContracts()
    },

    displayEmitterQueue: function() {
        displayQueue($('#emitter-table tbody'), this.queue.getOpenEmitter, this.queue.getEntryEmitter, 'emitter')
    },

    displayBeneficiaryQueue: function() {
        displayQueue($('#bene-table tbody'), this.queue.getOpenBeneficiary, this.queue.getEntryBeneficiary, 'bene')
    },

    displayAccounts: function(accounts) {
        $('.accounts-loading').remove()
        const balFmt = (bal) => (bal < 100)
            ? bal
            : bal.toFixed(2)
        const tbl = $('#accounts-table tbody')
        $.each(accounts, function(idx) {
            const account = accounts[idx]
            const bal = web3.fromWei(web3.eth.getBalance(account), 'ether')
            tbl.append(row([account, balFmt(bal)]))
        })
    },

    displayContracts: function() {
        const self = this
        self.contractStore.numContracts.call().then((num) => {
            let promises = []
            for (let i = 0; i < num; i++) {
                promises.push(self.contractStore.getContract.call(i))
            }
            return Promise.all(promises)
        }).then((addresses) => {
            $('.contracts-loading').remove()
            const tbl = $('#contracts-table tbody')
            addresses.forEach((addr) => {
                tbl.append(row([addr]))
            })
        })
    },

    contract : function(json) {
        const c = contract(json)
        c.setProvider(web3.currentProvider)
        return c
    },

    serviceAddress : function(name) {
        return this.services.serviceAddress.call(web3.sha3(name))
    },

    error : function(msg) {
        console.error(msg)
        alert(msg)
    }

}

function row(cellValues) {
    const tr = $('<tr/>')
    for (let i = 0; i < cellValues.length; i++) {
        tr.append(`<td>${cellValues[i]}</td>`)
    }
    return tr
}

function displayQueue(table, getIds, getEntry, name) {
    getIds().then((ids) => {
        let promises = []
        ids.forEach((id) => {
            promises.push(getEntry.call(id))
        })
        return Promise.all(promises)
    }).then((entries) => {
        $(`.${name}-loading`).remove()
        entries.forEach((entry, idx) => {
            let position = idx + 1
            if (position == 1)
                position = 'head'
            else if (position == entries.length)
                position = 'tail'
            table.append(row([
                position,
                entry[0],
                web3.fromWei(entry[1], 'ether')
            ]))
        })
    })
}

function clickChangePage() {
    var pageId = $(this).attr('id').substr('nav-btn-'.length)
    changePage(pageId)
    localStorage.setItem('page', pageId)
}

function changePage(pageId) {
    $('[id^="page-"]').hide()
    $('#page-' + pageId).show()
    $('[id^="nav-btn-"]').parent().removeClass('active')
    $('#nav-btn-' + pageId).parent().addClass('active')
}

window.addEventListener('load', () => {
    // Checking if Web3 has been injected by the browser
    if (typeof web3 !== 'undefined') {
        // Inside a DAPP browser - Mist/MetaMask/Status/etc.
        console.warn("web3 detected")
        window.web3 = new Web3(web3.currentProvider)
    } else {
        // Not inside a DAPP browser - use hosted server
        console.warn(`Using backup endpoint ${endpoint} because no web3 detected`)
        window.web3 = new Web3(new Web3.providers.HttpProvider(endpoint))
    }

    console.log(`isConnected: ${window.web3.isConnected()}`)

    App.start()
})
