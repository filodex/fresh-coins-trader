import etherscanApi from '../apis/EtherscanApi.js'
import path from 'path'
import fs from 'fs'

export class TraderService {
    constructor({} = {}) {}
    #listOfEthAddresses
    #listOfWalletsFilePath = path.join(path.resolve(), 'src', 'lib', 'goodWhales.json')

    async findTokensTradedByGoodWhales({ transfersTime = 600 } = {}) {
        // transfersTime in minutes
        const { tokensTradedSet } = await this.#getSetOfTokensTradedAndAddToEthAddress({
            listOfAddresses: this.#listOfEthAddresses,
            transfersTime,
        })
        console.log('set', tokensTradedSet)
        console.log(this.#listOfEthAddresses)

        const { tokensTradedMoreThanOnce } = this.#findTokensTradedMoreThanOneWallet({
            tokensTradedSet,
            listOfEthAddresses: this.#listOfEthAddresses,
        })

        this.#detalizeTradesData({ tokensTradedMoreThanOnce })

        return { tokensTradedByMoreThanOneWallet: tokensTradedMoreThanOnce }
    }
    #detalizeTradesData({ tokensTradedMoreThanOnce }) {
        /* Посчитать их статистику из имеющихся данных не получится, нужно делать еще запросы, т.к. в getListOfTokenTransfers не возвращаются данные по отправленным WETH
         * Посчитать, когда была последняя покупка, для каждого кошелька
         * Посчитать сколько всего купил каждый из кошельков
         * Посчитать сколько всего продал каждый
         */
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
