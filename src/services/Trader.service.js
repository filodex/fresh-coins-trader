import etherscanApi from '../apis/EtherscanApi.js'
import path from 'path'
import fs from 'fs'
import EthAddress from '../model/EthAddress.js'

export class TraderService {
    constructor({} = {}) {}
    #listOfEthAddresses
    #listOfWalletsFilePath = path.join(path.resolve(), 'src', 'lib', 'goodWhales.json')

    /**@returns {contractAddress,contractAddress} */
    async findTokensTradedByGoodWhales({ transfersTime = 30 } = {}) {
        // transfersTime in minutes
        const { tokensTradedSet } = await this.#getSetOfTokensTradedAndAddToEthAddress({
            listOfAddresses: this.#listOfEthAddresses,
            transfersTime,
        })
        // console.log('set', tokensTradedSet)
        // console.log(this.#listOfEthAddresses)

        const { tokensTradedMoreThanOnce } = this.#findTokensTradedMoreThanOneWallet({
            tokensTradedSet,
            listOfEthAddresses: this.#listOfEthAddresses,
        })

        this.#detalizeTradesData({ tokensTradedMoreThanOnce })

        return { tokensTradedByMoreThanOneWallet: tokensTradedMoreThanOnce }
    }
    async getLastPriceByContractAddress({ address }) {}
    #detalizeTradesData({ tokensTradedMoreThanOnce }) {
        /* Посчитать их статистику из имеющихся данных не получится, нужно делать еще запросы, т.к. в getListOfTokenTransfers не возвращаются данные по отправленным WETH
         * Посчитать, когда была последняя покупка, для каждого кошелька
         * Посчитать сколько всего купил каждый из кошельков
         * Посчитать сколько всего продал каждый
         */
        for (const contractAddressKey in tokensTradedMoreThanOnce) {
            const contractAddressDetails = tokensTradedMoreThanOnce[contractAddressKey]
            const walletsBoughtArr = contractAddressDetails.walletsBought
            contractAddressDetails.details = {}
            const allTransactionsTimeStamps = []
            const allBuysTimestamps = []

            for (const ethAddress of walletsBoughtArr) {
                // в ethAddress.latestTokenTransfers
                // найти последнюю транзакцию с contractAddressKey
                // найти последнюю покупку с contractAddressKey, где to === ethAddress.address
                contractAddressDetails.details[ethAddress.address] = {}

                ethAddress.latestTokenTransfers.find((transaction) => {
                    if (transaction.contractAddress.toLowerCase() === contractAddressKey.toLowerCase()) {
                        contractAddressDetails.details[ethAddress.address].lastTransactionDateWithThisToken =
                            new Date(transaction.timeStamp * 1000)
                        contractAddressDetails.details[ethAddress.address].lastTransactionTimeWithThisToken =
                            transaction.timeStamp * 1000

                        allTransactionsTimeStamps.push(transaction.timeStamp * 1000)

                        contractAddressDetails.tokenName = transaction.tokenName
                        contractAddressDetails.tokenSymbol = transaction.tokenSymbol
                        contractAddressDetails.tokenDecimal = transaction.tokenDecimal

                        return true
                    }
                })
                ethAddress.latestTokenTransfers.find((transaction) => {
                    if (
                        transaction.contractAddress.toLowerCase() === contractAddressKey.toLowerCase() &&
                        transaction.to.toLowerCase() === ethAddress.address.toLowerCase()
                    ) {
                        contractAddressDetails.details[ethAddress.address].lastBuyDateWithThisToken =
                            new Date(transaction.timeStamp * 1000)
                        contractAddressDetails.details[ethAddress.address].lastBuyTimeWithThisToken =
                            transaction.timeStamp * 1000

                        allBuysTimestamps.push(transaction.timeStamp * 1000)

                        return true
                    }
                })

                let buyValueCounter = 0
                let sellValueCounter = 0
                ethAddress.latestTokenTransfers.forEach((transaction) => {
                    if (transaction.contractAddress.toLowerCase() === contractAddressKey.toLowerCase()) {
                        if (transaction.to.toLowerCase() === ethAddress.address.toLowerCase()) {
                            buyValueCounter += Number(transaction.value)
                        } else {
                            sellValueCounter += Number(transaction.value)
                        }
                    }
                })

                contractAddressDetails.details[ethAddress.address].boughtSummary = buyValueCounter
                contractAddressDetails.details[ethAddress.address].soldSummary = sellValueCounter
            }

            contractAddressDetails.lastBuyDate = new Date(Math.max(...allBuysTimestamps))
            contractAddressDetails.lastBuyTime = Math.max(...allBuysTimestamps)
            contractAddressDetails.lastTransactionDate = new Date(Math.max(...allTransactionsTimeStamps))
            contractAddressDetails.lastTransactionTime = Math.max(...allTransactionsTimeStamps)
        }
    }
    #findTokensTradedMoreThanOneWallet({ tokensTradedSet, listOfEthAddresses }) {
        const tokensTradedCounter = {}
        for (const tokenAddress of tokensTradedSet) {
            tokensTradedCounter[tokenAddress] = { walletsCount: 0, walletsBought: [] }

            for (const ethAddress of listOfEthAddresses) {
                if (
                    ethAddress.latestTokenTransfers.find((value) => {
                        if (value.contractAddress === tokenAddress) {
                            return true
                        }
                    })
                ) {
                    tokensTradedCounter[tokenAddress].walletsCount += 1
                    tokensTradedCounter[tokenAddress].walletsBought.push(ethAddress)
                }
            }
        }

        for (const address in tokensTradedCounter) {
            if (tokensTradedCounter[address].walletsCount < 2) {
                delete tokensTradedCounter[address]
            }
        }

        return { tokensTradedMoreThanOnce: tokensTradedCounter }
    }

    #filterTransfersByLatest({ listOfTokenTransfers, transfersTime }) {
        const latestTokenTransfers = []
        for (const tokenTransfer of listOfTokenTransfers) {
            if (new Date().getTime() / 1000 - tokenTransfer.timeStamp < transfersTime * 60) {
                latestTokenTransfers.push(tokenTransfer)
            } else {
                break
            }
        }

        return { latestTokenTransfers }
    }
    async #getSetOfTokensTradedAndAddToEthAddress({ listOfAddresses, transfersTime }) {
        const tokensTradedSet = new Set()
        for (const ethAddress of listOfAddresses) {
            try {
                const { listOfTokenTransfers } = await etherscanApi.getListOfTokenTransfers({
                    address: ethAddress.address,
                    offset: 100,
                })

                const { latestTokenTransfers } = this.#filterTransfersByLatest({
                    listOfTokenTransfers,
                    transfersTime,
                })

                for (const transfer of latestTokenTransfers) {
                    tokensTradedSet.add(transfer.contractAddress)
                }
                ethAddress.latestTokenTransfers = latestTokenTransfers
                Object.defineProperty(ethAddress.latestTokenTransfers, 'updated', {
                    value: new Date(),
                    enumerable: false,
                })
            } catch (error) {
                throw new Error('Error in for of in getSetOfTokensTradedAndAddToEthAddress' + error)
            }
        }
        return { tokensTradedSet }
    }
    updateListOfEthAddressesFromFile() {
        const text = fs.readFileSync(this.#listOfWalletsFilePath)
        const listOfEthAddresses = JSON.parse(text)
        this.#listOfEthAddresses = listOfEthAddresses
        return { listOfEthAddresses }
    }
}

const traderService = new TraderService()
traderService.updateListOfEthAddressesFromFile()
export default traderService
