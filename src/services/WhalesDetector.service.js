import etherscanApi from '../Apis/EtherscanApi.js'
import syveApi from '../apis/SyveApi.js'
import configService from './Config.service.js'
import EthAddress from '../model/EthAddress.js'
import path from 'path'
import fs from 'fs'

export class WhalesDetectorService {
    #listOfWalletsFilePath = path.join(path.resolve(), 'src', 'lib', 'goodWhales.json')

    async getProfitableWhaleWalletsBoughtThisToken({ address }) {
        try {
            const { setOfWalletsBoughtThisToken } = await this.getSetOfWalletsBoughtThisToken({ address })
            const { addressesWithGoodProfit } = await this.findProfitableWalletsInListOfWallets({
                setOfWallets: setOfWalletsBoughtThisToken,
            })
            return { addressesWithGoodProfit }
        } catch (error) {
            console.log(`Error in getProfitableWhaleWalletsBoughtThisToken`, error)
        }
    }
    async getWalletTotalPerformance({ address, ethAddress }) {
        try {
            const { totalProfit, totalWalletPerformance } = await syveApi.getLatestTotalPerformance({
                address,
            })
            ethAddress.totalProfitStats = totalWalletPerformance
            let isProfitable
            if (Number(totalProfit) > configService.get('balanceEnoughThreshold')) {
                isProfitable = true
            } else {
                isProfitable = false
            }
            return { isProfitable, totalWalletPerformance }
        } catch (error) {
            console.log('Error in checkIsWalletProfitable', error)
        }
    }
    async getSetOfWalletsBoughtThisToken({ address }) {
        try {
            const setOfWalletsBoughtThisToken = new Set()
            const listOfWalletsBoughtThisToken = []
            const { listOfTokenTransfers } = await etherscanApi.getListOfTokenTransfers({
                address,
            })
            for (const tokenTransfer of listOfTokenTransfers) {
                const senderAdress = tokenTransfer.from
                if (tokenTransfer.tokenSymbol !== 'WETH') {
                    setOfWalletsBoughtThisToken.add(senderAdress)
                    listOfWalletsBoughtThisToken.push(senderAdress)
                }
            }
            return { setOfWalletsBoughtThisToken }
        } catch (error) {
            console.log('Error in getListOfWalletsToCheck', error)
        }
    }
    readListOfWhaleWalletsFromFile() {
        const text = fs.readFileSync(this.#listOfWalletsFilePath)
        const listOfWallets = JSON.parse(text)
        return { listOfWallets }
    }
    async findProfitableWalletsInListOfWallets({ setOfWallets }) {
        try {
            const addressesWithGoodProfit = []
            for (const address of setOfWallets) {
                const ethAddress = new EthAddress({ address })
                const { isProfitable } = await this.getWalletTotalPerformance({ address, ethAddress })
                if (isProfitable) {
                    addressesWithGoodProfit.push(ethAddress)
                }
            }

            return { addressesWithGoodProfit }
        } catch (error) {
            console.log('Error in findGoodWhalesInListOfWallets', error)
        }
    }
}

const whalesDetectorService = new WhalesDetectorService()
export default whalesDetectorService
