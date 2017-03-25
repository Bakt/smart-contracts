'use strict'

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css"

import {default as contract} from 'truffle-contract'

import servicesJSON from '../../build/contracts/Services.json'
import queueJSON from '../../build/contracts/Queue.json'
import csJSON from '../../build/contracts/ContractStore.json'
import bvcJSON from '../../build/contracts/BackedValueContract.json'
import exJSON from '../../build/contracts/ExchangeRate.json'

import truffleJs from '../../truffle'
import config from '../config.json'
const netConfig = truffleJs.networks[config.network]
const endpoint = (netConfig)
    ? `http://${netConfig.host}:${netConfig.port}`
    : `http://localhost:8545`

window.App = {
    start: function() {
        const self = this

        let servicesAddr
        if (netConfig && netConfig.services) {
            servicesAddr = netConfig.services
        } else if (servicesJSON.networks[web3.version.network].address) {
            servicesAddr = servicesJSON.networks[web3.version.network].address
        } else {
            self.error('no services address - migrate contracts and/or set address in config.json')
            return
        }

        const Services = self.contract(servicesJSON)
        const Queue = self.contract(queueJSON)
        const ContractStore = self.contract(csJSON)
        const ExchangeRate = self.contract(exJSON)

        Services.at(servicesAddr).then((inst) => {
            self.services = inst

            self.serviceAddress('Queue').then((qAddr) => {
                return Queue.at(qAddr)
            }).then((inst) => {
                self.queue = inst
                self.displayEmitterQueue()
                self.displayBeneficiaryQueue()
                self.displayBuyAsset()
            })

            self.services.contractStore().then((csAddr) => {
                return ContractStore.at(csAddr)
            }).then((inst) => {
                self.contractStore = inst
                self.displayContracts()
            })

            self.services.exchangeRate().then((exAddr) => {
                return ExchangeRate.at(exAddr)
            }).then((inst) => {
                self.exchangeRate = inst
                self.displayExchangeRate()
            })

            self.displayServices()
        })

        web3.eth.getAccounts((err, accs) => {
            if (err != null) {
                self.error("There was an error fetching your accounts.")
                return
            }
            self.accounts = accs
            self.account = accs[0]
            self.displayAccounts(self.accounts)
        })

        $('[id^="nav-btn-"]').click(clickChangePage)
        $('[id^="btn-send-"]').click(sendToQueue)
        $('[id="btn-update-exrate"]').click(self.updateExRate)

        var selectedPage = localStorage.getItem('page')
        if (selectedPage) {
            changePage(selectedPage)
        }
    },

    displayEmitterQueue: function() {
        displayQueue($('#emitter-table tbody'), this.queue.getOpenEmitter, this.queue.getEntryEmitter, 'emitter')
    },

    displayBeneficiaryQueue: function() {
        displayQueue($('#bene-table tbody'), this.queue.getOpenBeneficiary, this.queue.getEntryBeneficiary, 'bene')
    },

    displayBuyAsset: function() {
        const self = this
        self.queue.emitterChannel.call().then((channel) => {
            self.shortAddress = channel
            $('#short-address').text(channel)
        })
        self.queue.beneficiaryChannel.call().then((channel) => {
            self.longAddress = channel
            $('#long-address').text(channel)
        })
    },

    displayAccounts: function(accounts) {
        $('.accounts-loading').remove()
        const tbl = $('#accounts-table tbody')
        $.each(accounts, function(idx) {
            const account = accounts[idx]
            web3.eth.getBalance(account, (err, res) => {
                const bal = web3.fromWei(res, 'ether').toFixed(4)
                tbl.append(row([account, bal]))
                const text = `${account} (${bal} ETH)`
                addOption('short-select', account, text)
                addOption('long-select', account, text)
            })
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
            const BackedValueContract = self.contract(bvcJSON)
            const tOpen = $('#contracts-open-table tbody')
            const tClosed = $('#contracts-closed-table tbody')
            addresses.forEach((addr) => {
                BackedValueContract.at(addr).then((bvc) => {
                    return Promise.all([
                        bvc.emitter.call(),
                        bvc.beneficiary.call(),
                        bvc.pendingNotionalCents.call(),
                        bvc.notionalCents.call(),
                        self.contractStore.isOpen.call(addr)
                    ])
                }).then((bvcValues) => {
                    const isOpen = (bvcValues[4] === true)
                    const tbl = (isOpen) ? tOpen : tClosed
                    tbl.append(
                        row([
                            addr,
                            addrFmt(bvcValues[0]),
                            addrFmt(bvcValues[1]),
                            bvcValues[2],
                            bvcValues[3],
                        ])
                    )
                })
            })
        })
    },

    displayServices: function() {
        const s = this.services
        Promise.all([
            s.dollarToken.call(),
            s.serviceAddress.call(web3.sha3("Queue")),
            s.exchangeRate.call(),
            s.withdrawalReserves.call(),
            s.contractStore.call(),
            s.oraclizeFacade.call(),
            s.factory.call(),
        ]).then((res) => {
            const tbl = $('#services-table tbody')
            const add = (name, addr) => { tbl.append(row([name, addr])) }
            add("Services", s.address)
            add("DollarToken", res[0])
            add("Queue", res[1])
            add("ExchangeRate", res[2])
            add("WithdrawalReserves", res[3])
            add("ContractStore", res[5])
            add("OraclizeFacade", res[4])
            add("Factory", res[6])
            $(`.service-loading`).remove()
        })
    },

    displayExchangeRate: function() {
        const ex = this.exchangeRate
        Promise.all([
            ex.weiPerCent.call(),
            ex.centsPerEth.call(),
            ex.lastBlock.call()
        ]).then((res) => {
            const tbl = $('#exrate-table tbody')
            const add = (name, addr) => { tbl.append(row([name, addr])) }
            add("weiPerCent", `${res[0]} (${web3.fromWei(res[0], 'ether')} ETH)`)
            add("centsPerEth", res[1])
            add("lastBlock", res[2])
            $(`.exrate-loading`).remove()
        })
    },

    updateExRate: function() {
        const self = window.App

        const centsPerEth = parseInt($(`#exrate-new`).val())
        if (!Number.isInteger(centsPerEth) || centsPerEth <= 0) {
            alert('Cents per ETH invalid - enter a positive number')
            return
        }

        self.exchangeRate.receiveExchangeRate(centsPerEth, {
            from: web3.eth.defaultAccount // why is this not happening implicitly?
        }).then(() => {
            console.log(`Updated exchange rate to ${centsPerEth} cents per ETH`)
            $('#exrate-table tbody').empty()
            self.displayExchangeRate()
        }).catch((err) => {
            alert(`Update exchange rate failed: ${err}`)
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

function addrFmt(address) {
    if (!web3.isAddress(address)) {
        console.error(`NOT an address: ${address}, skipping formatting ...`)
        return address
    }
    const addrStr = address.substr(0, 10) + '...'
    return `<div data-toggle="tooltip" data-placement="right" title="${address}">${addrStr}</div>`
}

// puts a tooltip with Queue entry ID over the queue position index number
function positionFmt(pos, id) {
    return  `<div data-toggle="tooltip" data-placement="right" title="${id}">${pos}</div>`
}

function addOption(selectId, value, text) {
    $(`#${selectId}`).append(`<option value="${value}">${text}</option>`)
}

function displayQueue(table, getIds, getEntry, name) {
    let ids
    getIds().then((idsRet) => {
        ids = idsRet
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
                positionFmt(position, ids[idx]),
                addrFmt(entry[0]),
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

function displayStatus() {
    const tbl = $('#status-table tbody')
    const add = (name, addr) => { tbl.append(row([name, addr])) }
    add("web3 connected", web3.isConnected())
    add("web3 provider", web3.currentProvider.host)
    web3.version.getNetwork((err, res) => {
        add("network", res)
    })
    web3.eth.getBlockNumber((err, res) => {
        add("block height", res)
    })
    $(`.status-loading`).remove()
}

function sendToQueue() {
    const type = $(this).data('type')
    const account = $(`#${type}-select option:selected`).val()
    const amountEth = parseFloat($(`#${type}-value`).val())
    if (Number.isNaN(amountEth) || amountEth <= 0) {
        alert('ETHER amount invalid - enter a positive number for the ETHER amount')
        return
    }

    const amountWei = web3.toWei(amountEth, 'ether')
    const channelAddr = (type === "long") ? window.App.longAddress : window.App.shortAddress

    const txReq = {
        from: account,
        to: channelAddr,
        value: amountWei,
        gas: 500000
    }
    console.log(`sending ETH to channel: ${JSON.stringify(txReq)}`)
    web3.eth.sendTransaction(txReq, (err, result) => {
        if (err) {
            alert(`Error sending to channel: ${err}`)
        } else {
            alert(`ETH send to channel. Reload page and check Queue tab to see order.`)
        }
    })
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
    window.web3.eth.defaultAccount = web3.eth.accounts[0]

    console.log(`isConnected: ${window.web3.isConnected()}`)

    displayStatus()

    App.start()
})
