import etherscanApi from '../apis/EtherscanApi.js'
import path from 'path'
import fs from 'fs'
import EthAddress from '../model/EthAddress.js'
import dexScreenerApi from '../apis/DexScreenerApi.js'

export interface ITokensTradedMoreThanOnce {
    [key: string]: {
        walletsCount: number
        walletsBought: any[]
        details: { [key: string]: any }
        lastBuyDate: string
        lastBuyTime: number
        lastTransactionTime: number
        lastTransactionDate: string
        tokenDecimal: string
        tokenName: string
        tokenSymbol: string
    }
}

// const a: ITokensTradedMoreThanOnce =

export class TraderService {
    listOfEthAddresses: any
    constructor({} = {}) {}
    #listOfWalletsFilePath = path.join(
        path.resolve(),
        'diff',
        'goodWhales.json'
    )

    async findTokensTradedMoreThanOnce({ transfersTime = 60 } = {}): Promise<{
        tokensTradedMoreThanOnce: ITokensTradedMoreThanOnce
    }> {
        // transfersTime in minutes
        const { tokensTradedSet } =
            await this.#getSetOfTokensTradedAndAddToEthAddress({
                listOfAddresses: this.listOfEthAddresses,
                transfersTime,
            })
        console.log(
            'Токены, которые были сторгованы всеми кошельками из списка',
            tokensTradedSet
        )

        const { tokensTradedMoreThanOnce } =
            this.#findTokensTradedMoreThanOneWallet({
                tokensTradedSet,
                listOfEthAddresses: this.listOfEthAddresses,
            })

        this.#detalizeTradesData({ tokensTradedMoreThanOnce })

        return { tokensTradedMoreThanOnce }
    }
    async getLastPriceByContractAddress({ address }: { address: string }) {}
    #detalizeTradesData({
        tokensTradedMoreThanOnce,
    }: {
        tokensTradedMoreThanOnce: any
    }) {
        /* Посчитать их статистику из имеющихся данных не получится, нужно делать еще запросы, т.к. в getListOfTokenTransfers не возвращаются данные по отправленным WETH
         * Посчитать, когда была последняя покупка, для каждого кошелька
         * Посчитать сколько всего купил каждый из кошельков
         * Посчитать сколько всего продал каждый
         */
        for (const contractAddressKey in tokensTradedMoreThanOnce) {
            const contractAddressDetails =
                tokensTradedMoreThanOnce[contractAddressKey]
            const walletsBoughtArr = contractAddressDetails.walletsBought
            contractAddressDetails.details = {}
            const allTransactionsTimeStamps: any = []
            const allBuysTimestamps: any = []

            for (const ethAddress of walletsBoughtArr) {
                // в ethAddress.latestTokenTransfers
                // найти последнюю транзакцию с contractAddressKey
                // найти последнюю покупку с contractAddressKey, где to === ethAddress.address
                contractAddressDetails.details[ethAddress.address] = {}

                ethAddress.latestTokenTransfers.find((transaction: any) => {
                    if (
                        transaction.contractAddress.toLowerCase() ===
                        contractAddressKey.toLowerCase()
                    ) {
                        contractAddressDetails.details[
                            ethAddress.address
                        ].lastTransactionDateWithThisToken = new Date(
                            transaction.timeStamp * 1000
                        )
                        contractAddressDetails.details[
                            ethAddress.address
                        ].lastTransactionTimeWithThisToken =
                            transaction.timeStamp * 1000

                        allTransactionsTimeStamps.push(
                            transaction.timeStamp * 1000
                        )

                        contractAddressDetails.tokenName = transaction.tokenName
                        contractAddressDetails.tokenSymbol =
                            transaction.tokenSymbol
                        contractAddressDetails.tokenDecimal =
                            transaction.tokenDecimal

                        return true
                    }
                })
                ethAddress.latestTokenTransfers.find((transaction: any) => {
                    if (
                        transaction.contractAddress.toLowerCase() ===
                            contractAddressKey.toLowerCase() &&
                        transaction.to.toLowerCase() ===
                            ethAddress.address.toLowerCase()
                    ) {
                        contractAddressDetails.details[
                            ethAddress.address
                        ].lastBuyDateWithThisToken = new Date(
                            transaction.timeStamp * 1000
                        )
                        contractAddressDetails.details[
                            ethAddress.address
                        ].lastBuyTimeWithThisToken =
                            transaction.timeStamp * 1000

                        allBuysTimestamps.push(transaction.timeStamp * 1000)

                        return true
                    }
                })

                let buyValueCounter = 0
                let sellValueCounter = 0
                ethAddress.latestTokenTransfers.forEach((transaction: any) => {
                    if (
                        transaction.contractAddress.toLowerCase() ===
                        contractAddressKey.toLowerCase()
                    ) {
                        if (
                            transaction.to.toLowerCase() ===
                            ethAddress.address.toLowerCase()
                        ) {
                            buyValueCounter += Number(transaction.value)
                        } else {
                            sellValueCounter += Number(transaction.value)
                        }
                    }
                })

                contractAddressDetails.details[
                    ethAddress.address
                ].boughtSummary = buyValueCounter
                contractAddressDetails.details[ethAddress.address].soldSummary =
                    sellValueCounter
            }

            contractAddressDetails.lastBuyDate = new Date(
                Math.max(...allBuysTimestamps)
            )
            contractAddressDetails.lastBuyTime = Math.max(...allBuysTimestamps)
            contractAddressDetails.lastTransactionDate = new Date(
                Math.max(...allTransactionsTimeStamps)
            )
            contractAddressDetails.lastTransactionTime = Math.max(
                ...allTransactionsTimeStamps
            )
        }
    }
    #findTokensTradedMoreThanOneWallet({
        tokensTradedSet,
        listOfEthAddresses,
    }: {
        tokensTradedSet: any
        listOfEthAddresses: any
    }) {
        const tokensTradedMoreThanOnce: any = {}
        for (const tokenAddress of tokensTradedSet) {
            tokensTradedMoreThanOnce[tokenAddress] = {
                walletsCount: 0,
                walletsBought: [],
                tradesWithSells: 0,
            }

            for (const ethAddress of listOfEthAddresses) {
                let isLatestTokenTransferHasTokenFromSet =
                    ethAddress.latestTokenTransfers.find((value: any) => {
                        if (
                            value.contractAddress.toLowerCase() ===
                            tokenAddress.toLowerCase()
                        ) {
                            return true
                        }
                    })
                let isLatestTokenBuyHasTokenFromSet =
                    ethAddress.latestTokenTransfers.find((value: any) => {
                        if (
                            value.contractAddress.toLowerCase() ===
                                tokenAddress.toLowerCase() &&
                            isLatestTokenTransferHasTokenFromSet.to.toLowerCase() ===
                                ethAddress.address.toLowerCase()
                        ) {
                            return true
                        }
                    })

                if (isLatestTokenTransferHasTokenFromSet) {
                    tokensTradedMoreThanOnce[tokenAddress].tradesWithSells += 1
                }

                if (isLatestTokenBuyHasTokenFromSet) {
                    tokensTradedMoreThanOnce[tokenAddress].walletsCount += 1
                    tokensTradedMoreThanOnce[tokenAddress].walletsBought.push(
                        ethAddress
                    )
                }
            }
        }

        for (const address in tokensTradedMoreThanOnce) {
            if (tokensTradedMoreThanOnce[address].walletsCount < 2) {
                delete tokensTradedMoreThanOnce[address]
            }
        }

        return { tokensTradedMoreThanOnce }
    }

    #filterTransfersByLatest({
        listOfTokenTransfers,
        transfersTime,
    }: {
        listOfTokenTransfers: any[]
        transfersTime: any
    }) {
        const latestTokenTransfers: any[] = []
        for (const tokenTransfer of listOfTokenTransfers) {
            const transfer: any = tokenTransfer
            if (
                new Date().getTime() / 1000 - tokenTransfer.timeStamp <
                transfersTime * 60
            ) {
                latestTokenTransfers.push(transfer)
            } else {
                break
            }
        }

        return { latestTokenTransfers }
    }
    async #getSetOfTokensTradedAndAddToEthAddress({
        listOfAddresses,
        transfersTime,
    }: {
        listOfAddresses: Array<EthAddress>
        transfersTime: any
    }) {
        const tokensTradedSet = new Set()
        for (const ethAddress of listOfAddresses) {
            try {
                const { listOfTokenTransfers } =
                    await etherscanApi.getListOfTokenTransfers({
                        address: ethAddress.address,
                        offset: 100,
                    })

                const { latestTokenTransfers }: { latestTokenTransfers: any } =
                    this.#filterTransfersByLatest({
                        listOfTokenTransfers,
                        transfersTime,
                    })

                for (const transfer of latestTokenTransfers) {
                    tokensTradedSet.add(transfer.contractAddress)
                }
                ethAddress.latestTokenTransfers = latestTokenTransfers
                Object.defineProperty(
                    ethAddress.latestTokenTransfers,
                    'updated',
                    {
                        value: new Date(),
                        enumerable: false,
                    }
                )
            } catch (error) {
                // throw new Error('Error in for of in getSetOfTokensTradedAndAddToEthAddress' + error)
                console.log(error)
            }
        }
        return { tokensTradedSet }
    }

    updateListOfEthAddressesFromFile() {
        const text = fs.readFileSync(this.#listOfWalletsFilePath)
        const listOfEthAddresses: Array<EthAddress> = JSON.parse(String(text))
        this.listOfEthAddresses = listOfEthAddresses
        return { listOfEthAddresses }
    }

    handleListOfEthAddresses() {
        this.listOfEthAddresses.forEach((val: EthAddress) => {
            val = new EthAddress({ address: val.address })
        })
    }

    async getTokenPrice({
        tokenSymbol,
        tokenName,
    }: {
        tokenSymbol: string
        tokenName: string
    }) {
        let tokenPrice
        try {
            const pairs = await dexScreenerApi.getPairsDataByName(tokenSymbol)

            for (const pair of pairs) {
                if (
                    pair.pairCreatedAt ||
                    0 > new Date().getTime() - 1000 * 60 * 60 * 24
                ) {
                    if (pair.baseToken.name == tokenName) {
                        tokenPrice = pair.priceUsd
                        break
                    }
                }
            }
        } catch (error) {
            console.log(error)
        }

        return tokenPrice
    }
}

const traderService = new TraderService()
traderService.updateListOfEthAddressesFromFile()
export default traderService
