import etherscanApi from '../apis/EtherscanApi/EtherscanApi.js'
import syveApi from '../apis/SyveApi.js'
import configService from './config.service.js'

export class WhalesDetectorService {
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
    async checkIsWalletProfitable({ address }) {
        try {
            const { totalProfit } = await syveApi.getLatestTotalPerformance({ address })
            console.log(totalProfit, address)
            if (Number(totalProfit) > configService.get('balanceEnoughThreshold')) {
                return true
            } else {
                return false
            }
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
    async findProfitableWalletsInListOfWallets({ setOfWallets }) {
        try {
            const addressesWithGoodProfit = []
            for (const address of setOfWallets) {
                const isProfitable = await this.checkIsWalletProfitable({ address })
                if (isProfitable) {
                    addressesWithGoodProfit.push(address)
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
